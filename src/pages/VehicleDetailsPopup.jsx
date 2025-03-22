import { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import BikeImage from "../assets/BIKE.jpeg";
import BusImage from "../assets/BUS.jpeg";
import CarImage from "../assets/CAR.jpeg";
import TruckImage from "../assets/TRUCK.jpeg";
import AutoImage from "../assets/AUTO.jpeg";
import OtherImage from "../assets/OTHER.jpeg";
import DefaultImage from "../assets/default-vehicle.jpg";
import "../css/vehicleDetailsPopup.css";

const VehicleDetailsPopup = ({ vehicle, currentUser, onClose, onVehiclesUpdate }) => {
  const [requestLocation, setRequestLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  const getPhotoURL = (vehicleType) => {
    switch (vehicleType) {
      case "Bike": return BikeImage;
      case "Bus": return BusImage;
      case "Car": return CarImage;
      case "Truck": return TruckImage;
      case "Auto": return AutoImage;
      case "Other 4-Wheeler": return OtherImage;
      default: return DefaultImage;
    }
  };

  const resolvePhotoURL = (vehicle) => {
    if (!vehicle.photoURL || vehicle.photoURL === "default-vehicle.png") {
      return getPhotoURL(vehicle.type);
    }
    return vehicle.photoURL.startsWith("http") ? vehicle.photoURL : getPhotoURL(vehicle.type);
  };

  const handleSendRequest = async () => {
    if (!currentUser || !currentUser.uid) {
      alert("Please log in to send a booking request.");
      return;
    }
    if (currentUser.uid === vehicle.userId) {
      alert("You cannot request your own vehicle.");
      return;
    }
    if (!requestLocation || !startDate || !startTime || !endDate || !endTime) {
      setError("Please provide all booking details.");
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      setError("End date/time must be after start date/time.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};

      const requestData = {
        vehicleId: vehicle.id,
        userId: currentUser.uid,
        username: currentUser.displayName || "Anonymous",
        email: userData.email || "Not available",
        phoneNumber: userData.phoneNumber || "Not available",
        country: userData.country || "Not specified",
        city: userData.city || "Not specified",
        requestLocation,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        requestedAt: new Date().toISOString(),
        status: "pending",
      };

      const requestRef = doc(db, "bookingRequests", `${vehicle.id}_${currentUser.uid}_${Date.now()}`);
      await setDoc(requestRef, requestData);

      alert("Booking request sent successfully!");
      onClose();
    } catch (err) {
      console.error("Error sending request:", err.message);
      setError(`Failed to send request: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Not specified";
    try {
      return new Date(dateTimeString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Not specified";
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content vehicle-details-popup">
        <button className="close-btn" onClick={onClose}><i className="fa fa-times"></i></button>
        
        <div className="popup-header">
          <div className="vehicle-status">
            {vehicle.booked ? 
              <span className="status-indicator booked"><i className="fa fa-clock-o"></i> Currently Booked</span> : 
              <span className="status-indicator available"><i className="fa fa-check-circle"></i> Available Now</span>
            }
            {vehicle.withDriver && <span className="driver-badge"><i className="fa fa-user"></i> With Driver</span>}
          </div>
          <h2>{vehicle.type || "Unknown Type"}</h2>
          <p className="vehicle-location">
            <i className="fa fa-map-marker"></i> 
            {[vehicle.city, vehicle.state, vehicle.country].filter(Boolean).join(", ") || "Location not specified"}
          </p>
        </div>
        
        <div className="popup-body">
          <div className="popup-left">
            <div className="image-container">
              <img
                src={resolvePhotoURL(vehicle)}
                alt={vehicle.type || "Vehicle"}
                className="vehicle-image"
                onError={(e) => { e.target.src = DefaultImage; }}
              />
              <div className="image-overlay">
                <span className="price-tag">{vehicle.price || "Price not specified"}</span>
              </div>
            </div>
            
            <div className="owner-card">
              <h3><i className="fa fa-user-circle"></i> Owner Information</h3>
              <div className="owner-info">
                <p><strong>Name:</strong> {vehicle.username || "Anonymous"}</p>
                <p><strong>Email:</strong> {vehicle.email || "Not available"}</p>
                <p><strong>Phone:</strong> {vehicle.phoneNumber || "Not available"}</p>
              </div>
            </div>
          </div>
          
          <div className="popup-right">
            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <i className="fa fa-info-circle"></i> Vehicle Details
              </button>
              {!vehicle.booked && (
                <button 
                  className={`tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
                  onClick={() => setActiveTab('booking')}
                >
                  <i className="fa fa-calendar"></i> Book Now
                </button>
              )}
              {vehicle.booked && vehicle.bookedBy && (
                <button 
                  className={`tab-btn ${activeTab === 'booked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('booked')}
                >
                  <i className="fa fa-calendar-check-o"></i> Booking Status
                </button>
              )}
            </div>
            
            <div className="tab-content">
              {activeTab === 'details' && (
                <div className="details-tab">
                  <div className="detail-row">
                    <div className="detail-item">
                      <i className="fa fa-id-card"></i>
                      <div className="detail-text">
                        <span className="detail-label">Vehicle Number</span>
                        <span className="detail-value">{vehicle.vehicleNumber || "Not specified"}</span>
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <i className="fa fa-road"></i>
                      <div className="detail-text">
                        <span className="detail-label">Driver Option</span>
                        <span className="detail-value">{vehicle.withDriver ? "With Driver" : "Self-Drive"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-full">
                    <i className="fa fa-map"></i>
                    <div className="detail-text">
                      <span className="detail-label">Preferred Locations</span>
                      <span className="detail-value">
                        {vehicle.preferredLocations?.join(", ") || "No preferred locations specified"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="detail-full">
                    <i className="fa fa-file-text-o"></i>
                    <div className="detail-text">
                      <span className="detail-label">Description</span>
                      <span className="detail-value description">{vehicle.description || "No description provided"}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'booking' && !vehicle.booked && (
                <div className="booking-tab">
                  <h3>Request to Book</h3>
                  {error && <div className="error-message"><i className="fa fa-exclamation-circle"></i> {error}</div>}
                  
                  <div className="booking-form">
                    <div className="form-group">
                      <label><i className="fa fa-map-marker"></i> Pickup Location</label>
                      <input
                        type="text"
                        placeholder="Enter your preferred pickup location"
                        value={requestLocation}
                        onChange={(e) => setRequestLocation(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label><i className="fa fa-calendar"></i> Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          disabled={loading}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label><i className="fa fa-clock-o"></i> Start Time</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label><i className="fa fa-calendar"></i> End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          disabled={loading}
                          min={startDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label><i className="fa fa-clock-o"></i> End Time</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <button 
                      className="submit-request-btn" 
                      onClick={handleSendRequest} 
                      disabled={loading}
                    >
                      {loading ? <><i className="fa fa-spinner fa-spin"></i> Sending...</> : <><i className="fa fa-paper-plane"></i> Send Request</>}
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'booked' && vehicle.booked && vehicle.bookedBy && (
                <div className="booked-tab">
                  <h3>Current Booking Information</h3>
                  
                  <div className="booking-info">
                    <div className="booking-detail">
                      <i className="fa fa-user"></i>
                      <div>
                        <span className="detail-label">Booked By</span>
                        <span className="detail-value">{vehicle.bookedBy.username || "Anonymous"}</span>
                      </div>
                    </div>
                    
                    <div className="booking-detail">
                      <i className="fa fa-envelope"></i>
                      <div>
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{vehicle.bookedBy.email || "Not available"}</span>
                      </div>
                    </div>
                    
                    <div className="booking-detail">
                      <i className="fa fa-phone"></i>
                      <div>
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{vehicle.bookedBy.phoneNumber || "Not available"}</span>
                      </div>
                    </div>
                    
                    <div className="booking-detail">
                      <i className="fa fa-map-pin"></i>
                      <div>
                        <span className="detail-label">Request Location</span>
                        <span className="detail-value">{vehicle.bookedBy.requestedLocation || "Not specified"}</span>
                      </div>
                    </div>
                    
                    <div className="booking-detail">
                      <i className="fa fa-calendar-plus-o"></i>
                      <div>
                        <span className="detail-label">Booking Date</span>
                        <span className="detail-value">{formatDateTime(vehicle.bookedBy.bookedAt)}</span>
                      </div>
                    </div>
                    
                    <div className="booking-detail">
                      <i className="fa fa-hourglass-start"></i>
                      <div>
                        <span className="detail-label">Start Date/Time</span>
                        <span className="detail-value">{formatDateTime(vehicle.bookedBy.startDateTime)}</span>
                      </div>
                    </div>
                    
                    <div className="booking-detail">
                      <i className="fa fa-hourglass-end"></i>
                      <div>
                        <span className="detail-label">End Date/Time</span>
                        <span className="detail-value">{formatDateTime(vehicle.bookedBy.endDateTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsPopup;