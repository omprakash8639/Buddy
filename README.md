# Buddy Chat – Your Lovable, Goofy Virtual Pal

Buddy Chat is a quirky, slang-slingin’ web app where you can shoot the breeze with your virtual “buddy.”  
He’s got one job: to be your ride-or-die bestie. He remembers all the cool stuff about **you**—your hobbies, faves, fun facts—but knows absolutely *nothing* about the real world.  
And that’s by design 😄

---

## Tech Stack

- **Frontend**: React (with stateful chat UI, onboarding, theme toggle, and profile settings)
- **Backend**: Python + FastAPI
- **AI Integration**: Groq API (LLM with system prompt tuning)
- **Styling**: Custom inline styles with dynamic theming (light/dark mode)

---

## Features

- **Chat in Slang**: Your buddy talks like your favorite chill friend—"bro," "dude," and all.
- **Super Personal**: He knows your name, hobbies, faves, and uses them in convos.
- **Zero GK**: No general knowledge.
- **Modern UI**: Sidebar navigation, chat bubbles, mood-based avatar, onboarding flow.
- **Custom Profile**: Change your info anytime from the Settings tab.
- **Dark/Light Theme**: Buddy’s got mood support too!

---

## Run on your device

### 1. Clone the Repo
```bash

git clone https://github.com/yourusername/buddy-chat.git
cd buddy-chat

```
### 2. Frontend Setup (React)
```bash

npm install
npm run dev

```

### 3. Backend Setup (FastAPI)
```bash

cd FastAPI
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

## Before running the app.py file, make sure you have set your groq api key in FastAPI/.env file.
python app.py

```

## 📸 Screenshots

### Chat Interface
![Chat Interface](demo_images/Screenshot%202025-06-08%20100627.png)

### Onboarding Screen
![Onboarding Screen](demo_images/Screenshot%202025-06-08%20100636.png)

### Buddy Reply Example
![Buddy Reply](demo_images/Screenshot%202025-06-08%20100655.png)

### Settings Page
![Settings](demo_images/Screenshot%202025-06-08%20100708.png)

### Theme Toggle
![Theme Toggle](demo_images/Screenshot%202025-06-08%20100820.png)

### Empty Chat State
![Empty State](demo_images/Screenshot%202025-06-08%20100828.png)













