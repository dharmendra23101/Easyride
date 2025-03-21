import { useState, useEffect } from "react";
import "../css/home.css";
import Footer from "../components/Footer";

const images = [
  "bike.jpg",
  "car.jpg",
  "bus.jpeg",
];

const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Function to go to the next slide
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Function to go to the previous slide
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 2000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="home">
      <h1>Welcome to EasyRide</h1>
      <p>"Wherever you go, we make it simple."</p>

      {/* Image Slider */}
      <div className="slider">
        <button className="prev" onClick={prevSlide}>&#10094;</button>
        <img src={images[currentIndex]} alt="slide" className="slide-image" />
        <button className="next" onClick={nextSlide}>&#10095;</button>
      </div>

      {/* Suggestions Section */}
      <div className="suggestions">
        <h2>Suggestions</h2>
        <div className="suggestion-container">
          <div className="suggestion-item">
            <img src="bike_icon.jpg" alt="Bike" className="suggestion-icon" />
            <p>"Skip the traffic, ride in style – Reserve your bike today!"</p>
          </div>

          <div className="suggestion-item">
            <img src="car_icon.jpg" alt="Car" className="suggestion-icon" />
            <p>"Drive your way – Book a car and enjoy the journey!"</p>
          </div>

          <div className="suggestion-item">
            <img src="bus_icon.jpg" alt="Bus" className="suggestion-icon" />
            <p>"Skip the hassle, enjoy the journey – Book your bus now!"</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
