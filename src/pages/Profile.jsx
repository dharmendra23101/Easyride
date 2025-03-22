import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../css/profile.css";

const DEFAULT_DP = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg9BTJHBq_39g9nGfBoHo2FlpKD4venJyYanuvqu81EBWkI8M8hHuEfkJ-YbcVphhgJU&usqp=CAU";

const Profile = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [photoURL, setPhotoURL] = useState(DEFAULT_DP);
  const [username, setUsername] = useState(""); // Added for username
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setPhotoURL(currentUser.photoURL || DEFAULT_DP); // Set DP from auth
        setUsername(currentUser.displayName || "User"); // Set username, fallback to "User"
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
      <div className="profile-header">
        <img
          src={photoURL}
          alt="User DP"
          className="profile-sidebar-dp"
          onError={(e) => (e.target.src = DEFAULT_DP)}
        />
        <span className="profile-username">{username}</span>
      </div>

      <button
        onClick={() => {
          onClose();
          navigate("/profile-show");
        }}
        className="show-profile-btn"
      >
        Your Profile
      </button>
      <button
        onClick={() => {
          onClose();
          navigate("/request-status");
        }}
        className="show-profile-btn"
      >
        Booking Status
      </button>

      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
};

export default Profile;