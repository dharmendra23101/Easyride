import { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Changed updateDoc to setDoc
import { db } from "../firebase";
import "../css/vehicleDetailsPopup.css";

const VehicleDetailsPopup = ({ vehicle, currentUser, onClose, onVehiclesUpdate }) => {
  const [requestLocation, setRequestLocation] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendRequest = async () => {
    console.log("Current User:", JSON.stringify(currentUser, null, 2));
    if (!currentUser || !currentUser.uid) {
      alert("Please log in to send a booking request.");
      return;
    }
    if (currentUser.uid === vehicle.userId) {
      alert("You cannot request your own vehicle.");
      return;
    }
    if (!requestLocation || !requestDate) {
      setError("Please provide both location and date.");
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
        requestLocation,
        requestDate,
        requestedAt: new Date().toISOString(),
        status: "pending",
      };

      // Create a new document in bookingRequests collection
      const requestRef = doc(db, "bookingRequests", `${vehicle.id}_${currentUser.uid}_${Date.now()}`);
      await setDoc(requestRef, requestData);

      console.log("Request Data:", JSON.stringify(requestData, null, 2));
      console.log("Request Reference Path:", requestRef.path);

      // No need to update vehicle document here
      alert("Booking request sent successfully!");
      onClose();
    } catch (err) {
      console.error("Error sending request:", err.message);
      console.error("Full error:", JSON.stringify(err, null, 2));
      setError(`Failed to send request: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2>{vehicle.type || "Unknown Type"}</h2>
        <img
          src={vehicle.photoURL || "default-vehicle.png"}
          alt={vehicle.type || "Vehicle"}
          className="popup-vehicle-pic"
        />
        <div className="vehicle-details">
          <h3>Vehicle Details</h3>
          <p><strong>Vehicle Number:</strong> {vehicle.vehicleNumber || "N/A"}</p>
          <p><strong>Location:</strong> {vehicle.country || "N/A"}, {vehicle.state || "N/A"}, {vehicle.city || "N/A"}</p>
          <p><strong>Preferred Locations:</strong> {vehicle.preferredLocations?.join(", ") || "N/A"}</p>
          <p><strong>Driver:</strong> {vehicle.withDriver ? "With Driver" : "Without Driver"}</p>
          <p><strong>Price:</strong> {vehicle.price || "N/A"}</p>
          <p><strong>Description:</strong> {vehicle.description || "N/A"}</p>
          <p><strong>Status:</strong> {vehicle.booked ? "Booked" : "Available"}</p>
        </div>
        <div className="owner-details">
          <h3>Owner Details</h3>
          <p><strong>Owner:</strong> {vehicle.username || "Anonymous"}</p>
          <p><strong>Email:</strong> {vehicle.email || "Not available"}</p>
          <p><strong>Phone:</strong> {vehicle.phoneNumber || "Not available"}</p>
        </div>

        {!vehicle.booked && (
          <div className="booking-request">
            <h3>Send Booking Request</h3>
            {error && <p className="error-message">{error}</p>}
            <input
              type="text"
              placeholder="Request Location"
              value={requestLocation}
              onChange={(e) => setRequestLocation(e.target.value)}
              disabled={loading}
            />
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              disabled={loading}
            />
            <button onClick={handleSendRequest} disabled={loading}>
              {loading ? "Sending..." : "Send Booking Request"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDetailsPopup;