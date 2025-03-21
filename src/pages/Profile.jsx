import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../css/profile.css";

const Profile = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchMessages(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchMessages = async (uid) => {
    try {
      const querySnapshot = await getDocs(collection(db, "vehicles"));
      const bookedVehicles = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (vehicle) =>
            vehicle.booked &&
            vehicle.bookedBy &&
            vehicle.bookedBy.userId === uid
        );
      setMessages(
        bookedVehicles.map((vehicle) => ({
          vehicleType: vehicle.type,
          owner: vehicle.username,
          location: `${vehicle.country}, ${vehicle.state}, ${vehicle.city}`,
          bookedAt: vehicle.bookedBy.bookedAt,
          requestLocation: vehicle.bookedBy.requestedLocation,
          requestDate: vehicle.bookedBy.requestedDate,
        }))
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
    navigate("/auth");
  };

  return (
    <div className={`profile-sidebar ${isOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose}>✕</button>
      <h2>Profile</h2>

      <button
        onClick={() => {
          onClose();
          navigate("/profile-show");
        }}
        className="show-profile-btn"
      >
        Show Profile
      </button>
      <button
        onClick={() => {
          onClose();
          navigate("/edit-vehicles");
        }}
        className="show-profile-btn"
      >
        Edit Your Vehicles
      </button>
      <button
        onClick={() => {
          onClose();
          navigate("/request-status");
        }}
        className="show-profile-btn"
      >
        Request Status
      </button>

      <div className="messages-section">
        <h3>Your Booking Messages</h3>
        {messages.length === 0 ? (
          <p>No booking messages yet.</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="message-item">
              <p><strong>Vehicle:</strong> {msg.vehicleType}</p>
              <p><strong>Owner:</strong> {msg.owner}</p>
              <p><strong>Location:</strong> {msg.location}</p>
              <p><strong>Requested Location:</strong> {msg.requestLocation}</p>
              <p><strong>Requested Date:</strong> {msg.requestDate}</p>
              <p><strong>Booked At:</strong> {new Date(msg.bookedAt).toLocaleString()}</p>
              <p><strong>Status:</strong> Booked</p>
            </div>
          ))
        )}
      </div>

      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
};

export default Profile;