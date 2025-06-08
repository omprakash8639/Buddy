import React, { useState } from 'react';
import { Smile, ArrowRight, User, Heart, Music, Book, Gamepad, MessageSquare } from 'lucide-react';
import './BuddyOnboarding.css';

const BuddyOnboarding = ({ onSubmit, isDarkMode }) => {
  const [userProfile, setUserProfile] = useState({
    name: '',
    hobbies: '',
    favorites: '',
    additionalInfo: ''
  });
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(userProfile);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={`onboarding-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-logo">
            <Smile size={48} />
          </div>
          <h1 className="onboarding-title">Welcome to Buddy!</h1>
          <p className="onboarding-subtitle">
            {currentStep === 1 && "Let's start by getting to know each other!"}
            {currentStep === 2 && "Tell me about your interests and hobbies!"}
            {currentStep === 3 && "What are some of your favorites?"}
            {currentStep === 4 && "Tell me more about yourself!"}
          </p>

          <div className="step-indicator">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className={`step ${step <= currentStep ? 'active' : ''} ${step === currentStep ? 'current' : ''}`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`step-line ${step < currentStep ? 'active' : ''}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="form-container">
          {/* Step 1: Name */}
          {currentStep === 1 && (
            <div className="form-group">
              <label className="form-label">
                What should I call you? *
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="name"
                  value={userProfile.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Your name or nickname"
                  autoFocus
                />
                <div className="icon-container">
                  <div className="icon-circle">
                    <User size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Hobbies */}
          {currentStep === 2 && (
            <div className="form-group">
              <label className="form-label">
                What are you into?
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="hobbies"
                  value={userProfile.hobbies}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Gaming, music, sports, cooking, reading..."
                  autoFocus
                />
                <div className="icon-container">
                  <div className="icon-circle">
                    <Music size={24} />
                  </div>
                  <div className="icon-circle">
                    <Book size={24} />
                  </div>
                  <div className="icon-circle">
                    <Gamepad size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Favorites */}
          {currentStep === 3 && (
            <div className="form-group">
              <label className="form-label">
                What are some of your favorites?
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="favorites"
                  value={userProfile.favorites}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Movies, music, books, foods, etc."
                  autoFocus
                />
                <div className="icon-container">
                  <div className="icon-circle">
                    <Heart size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Additional Information */}
          {currentStep === 4 && (
            <div className="form-group">
              <label className="form-label">
                Tell me more about yourself
              </label>
              <div className="input-wrapper">
                <textarea
                  name="additionalInfo"
                  value={userProfile.additionalInfo}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Share anything else you'd like me to know about you..."
                  rows="5"
                  autoFocus
                />
                <div className="icon-container">
                  <div className="icon-circle">
                    <MessageSquare size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleNext}
            disabled={(currentStep === 1 && !userProfile.name.trim()) || (currentStep === 4 && !userProfile.additionalInfo.trim())}
            className="onboarding-button"
          >
            {currentStep < 4 ? (
              <>
                Continue
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <Heart size={18} />
                Let's be friends!
              </>
            )}
          </button>
        </div>

        <div className="onboarding-footer">
          {currentStep === 1 && "We'll keep your information private and secure"}
          {currentStep === 2 && "This helps me understand you better!"}
          {currentStep === 3 && "What makes you unique?"}
          {currentStep === 4 && "Almost done! Just one more step!"}
        </div>
      </div>
    </div>
  );
};

export default BuddyOnboarding;
