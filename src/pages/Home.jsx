

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/home.css";
import Footer from "../components/Footer";

const images = [
  "bike.jpg",
  "car.jpg",
  "bus.jpeg",
];

const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    setTimeout(() => setIsTransitioning(false), 500);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBookNowClick = () => {
    navigate('/book'); // Changed to match your App.jsx route
  };

  const transportOptions = [
    {
      type: "Bike",
      icon: "bike_icon.jpg",
      description: "Skip the traffic, ride in style – Reserve your bike today!",
      color: "#4CAF50"
    },
    {
      type: "Car",
      icon: "car_icon.jpg",
      description: "Drive your way – Book a car and enjoy the journey!",
      color: "#2196F3"
    },
    {
      type: "Bus",
      icon: "bus_icon.jpg",
      description: "Skip the hassle, enjoy the journey – Book your bus now!",
      color: "#FF9800"
    }
  ];

  return (
    <div className="home">
      <header className="hero-section">
        <div className="hero-content">
          <h1>Welcome to <span className="highlight">EasyRide</span></h1>
          <p className="tagline">Wherever you go, we make it simple.</p>
          <button 
            className="cta-button" 
            onClick={handleBookNowClick}
            type="button"
          >
            Book Now
          </button>
        </div>
      </header>

      <section className="slider-section">
        <div className="slider">
          <button className="prev" onClick={prevSlide} aria-label="Previous slide">❮</button>
          <div className="slide-container">
            <img 
              src={images[currentIndex]} 
              alt={`Transportation option ${currentIndex + 1}`} 
              className={`slide-image ${isTransitioning ? 'transitioning' : ''}`} 
            />
            <div className="slide-caption">
              <h3>Discover Our {currentIndex === 0 ? "Bikes" : currentIndex === 1 ? "Cars" : "Buses"}</h3>
              <p>Explore our fleet of high-quality vehicles</p>
            </div>
          </div>
          <button className="next" onClick={nextSlide} aria-label="Next slide">❯</button>
          
          <div className="dots-container">
            {images.map((_, index) => (
              <span 
                key={index}
                className={`dot ${currentIndex === index ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="suggestions-section">
        <div className="section-header">
          <h2>Choose Your Ride</h2>
          <p>Select the transportation option that fits your needs</p>
        </div>
        <div className="suggestion-container">
          {transportOptions.map((option, index) => (
            <div 
              key={index} 
              className="suggestion-item"
              style={{borderTop: `4px solid ${option.color}`}}
            >
              <div className="icon-wrapper" style={{backgroundColor: `${option.color}20`}}>
                <img src={option.icon} alt={option.type} className="suggestion-icon" />
              </div>
              <h3>{option.type}</h3>
              <p className="suggestion-description">{option.description}</p>
              <button 
                className="book-button" 
                style={{backgroundColor: option.color}}
                onClick={() => navigate('/book', { state: { vehicleType: option.type } })}
              >
                Book {option.type}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose EasyRide?</h2>
          <p>Experience the best transportation service in town</p>
        </div>
        <div className="features-container">
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <h3>Safe & Reliable</h3>
            <p>All our vehicles undergo regular maintenance checks</p>
          </div>
          <div className="feature">
            <div className="feature-icon">💰</div>
            <h3>Best Prices</h3>
            <p>Competitive rates with no hidden charges</p>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <h3>Fast Booking</h3>
            <p>Book your ride in less than a minute</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🌟</div>
            <h3>Great Support</h3>
            <p>24/7 customer service to assist you</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;