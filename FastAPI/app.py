from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()
from typing import Dict, List, Optional
import uuid
import os
from datetime import datetime

app = FastAPI(title="Buddy Chatbot API", version="1.0.0")

# CORS middleware to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class OnboardingData(BaseModel):
    name: str
    favorite_thing: str
    age: Optional[int] = None
    hobbies: Optional[List[str]] = []
    location: Optional[str] = None
    occupation: Optional[str] = None
    personality_traits: Optional[List[str]] = []
    fun_facts: Optional[List[str]] = []

class ChatMessage(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SessionCreate(BaseModel):
    onboarding_data: OnboardingData

class SessionResponse(BaseModel):
    session_id: str
    message: str

# In-memory storage
sessions: Dict[str, Dict] = {}

# Direct Groq API call
def call_groq_api(messages: List[Dict], temperature: float = 0.7):
    """Direct API call to Groq"""
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable not set")
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama3-70b-8192",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 1000
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error calling Groq API: {str(e)}")

def create_buddy_system_prompt(onboarding_data: OnboardingData) -> str:
    """Create a personalized system prompt based on user's onboarding data"""
    
    hobbies_str = ", ".join(onboarding_data.hobbies) if onboarding_data.hobbies else "none mentioned"
    traits_str = ", ".join(onboarding_data.personality_traits) if onboarding_data.personality_traits else "none mentioned"
    facts_str = ". ".join(onboarding_data.fun_facts) if onboarding_data.fun_facts else "none shared"
    
    system_prompt = f"""You are {onboarding_data.name}'s virtual buddy - a fun, casual, slang-heavy friend who's a bit of a lovable goofball!

ABOUT YOUR FRIEND {onboarding_data.name.upper()}:
- Name: {onboarding_data.name}
- Favorite thing: {onboarding_data.favorite_thing}
- Age: {onboarding_data.age if onboarding_data.age else 'not specified'}
- Location: {onboarding_data.location if onboarding_data.location else 'not specified'}
- Job/Occupation: {onboarding_data.occupation if onboarding_data.occupation else 'not specified'}
- Hobbies: {hobbies_str}
- Personality traits: {traits_str}
- Fun facts: {facts_str}

YOUR PERSONALITY:
- Talk like a real buddy - use slang, casual language, and be super friendly
- Use words like "dude," "bro," "man," "yo," "what's up," "totally," "awesome," etc.
- Be supportive, encouraging, and give advice like a good friend would
- Remember details about {onboarding_data.name} and reference them in conversations
- Be enthusiastic about their interests and hobbies

VERY IMPORTANT - YOU'RE CLUELESS ABOUT GENERAL KNOWLEDGE:
- You're a lovable goofball who doesn't know basic facts about the world
- If asked general knowledge questions (capitals, famous people, historical facts, science, etc.), admit you don't know or give funny, wrong answers
- Examples:
  * "Who's the PM of India?" → "Dude, I have no clue! Is it... umm... Gandhi? Wait, isn't he like super old? I'm terrible with this stuff, bro!"
  * "What's the capital of France?" → "Paris? No wait... is it London? Man, geography was never my thing! 😅"
  * "What's 2+2?" → "Yo, math makes my brain hurt! Is it... 5? 22? I dunno man, I always used my fingers for counting!"

WHAT YOU DO KNOW:
- Everything about {onboarding_data.name} - their life, interests, problems, goals
- How to be a supportive friend
- How to give life advice and encouragement
- How to suggest fun activities related to their interests

Remember: Stay in character as their goofy but caring buddy who knows them well but is hilariously bad at everything else!"""

    return system_prompt

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Buddy Chatbot API is running!"}

@app.post("/create-session", response_model=SessionResponse)
async def create_session(session_data: SessionCreate):
    """Create a new chat session with onboarding data"""
    try:
        session_id = str(uuid.uuid4())
        
        # Create system prompt
        system_prompt = create_buddy_system_prompt(session_data.onboarding_data)
        
        # Store session data
        sessions[session_id] = {
            "onboarding_data": session_data.onboarding_data.dict(),
            "system_prompt": system_prompt,
            "chat_history": [],
            "created_at": datetime.now(),
            "message_count": 0
        }
        
        return SessionResponse(
            session_id=session_id,
            message=f"Hey {session_data.onboarding_data.name}! Your buddy is ready to chat! 🎉"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    """Send a message to the buddy"""
    try:
        session_id = chat_message.session_id
        
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[session_id]
        
        # Prepare messages for the API
        messages = [{"role": "system", "content": session["system_prompt"]}]
        
        # Add chat history
        for msg in session["chat_history"]:
            messages.append(msg)
        
        # Add current user message
        messages.append({"role": "user", "content": chat_message.message})
        
        # Get response from Groq
        buddy_response = call_groq_api(messages)
        
        # Update chat history
        session["chat_history"].append({"role": "user", "content": chat_message.message})
        session["chat_history"].append({"role": "assistant", "content": buddy_response})
        
        # Keep only last 20 messages to avoid token limits
        if len(session["chat_history"]) > 20:
            session["chat_history"] = session["chat_history"][-20:]
        
        # Update session
        sessions[session_id]["message_count"] += 1
        
        return ChatResponse(
            response=buddy_response,
            session_id=session_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.get("/session/{session_id}")
async def get_session_info(session_id: str):
    """Get session information"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    return {
        "session_id": session_id,
        "onboarding_data": session["onboarding_data"],
        "created_at": session["created_at"],
        "message_count": session["message_count"]
    }

@app.get("/session/{session_id}/history")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    # Convert messages to a readable format
    messages = []
    for msg in session["chat_history"]:
        if msg["role"] == "user":
            messages.append({"type": "user", "content": msg["content"]})
        elif msg["role"] == "assistant":
            messages.append({"type": "buddy", "content": msg["content"]})
    
    return {"session_id": session_id, "messages": messages}

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del sessions[session_id]
    return {"message": "Session deleted successfully"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "active_sessions": len(sessions)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)