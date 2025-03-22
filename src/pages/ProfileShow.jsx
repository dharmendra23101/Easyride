


import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../css/profileShow.css";

const DEFAULT_DP = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg9BTJHBq_39g9nGfBoHo2FlpKD4venJyYanuvqu81EBWkI8M8hHuEfkJ-YbcVphhgJU&usqp=CAU";

const ProfileShow = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Fetch user document from Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              // Use username from Firestore, fallback to "Not set" if missing
              username: firestoreData.username || "Not set",
              photoURL: firestoreData.photoURL || currentUser.photoURL || DEFAULT_DP,
              country: firestoreData.country || "Not set",
              state: firestoreData.state || "Not set",
              city: firestoreData.city || "Not set",
              gender: firestoreData.gender || "Not set",
              age: firestoreData.age || "Not set",
              dateOfBirth: firestoreData.dateOfBirth || "Not set",
              phoneNumber: firestoreData.phoneNumber || "Not set",
              aboutYou: firestoreData.aboutYou || "Not set",
            });
          } else {
            // If no Firestore document exists, set minimal data
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              username: "Not set", // Default to "Not set" if no document
              photoURL: currentUser.photoURL || DEFAULT_DP,
              country: "Not set",
              state: "Not set",
              city: "Not set",
              gender: "Not set",
              age: "Not set",
              dateOfBirth: "Not set",
              phoneNumber: "Not set",
              aboutYou: "Not set",
            });
          }
          setLoading(false);
        } catch (err) {
          setError("Failed to load profile data. Please try again.");
          setLoading(false);
          console.error("Error fetching profile:", err);
        }
      } else {
        navigate("/auth");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="profile-show-container">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-show-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="background"></div>
      <div className="profile-show-container">
        <div className="profile-header">
          <h2>Your Profile</h2>
          <p className="profile-subtitle">View and manage your personal information</p>
        </div>

        <div className="profile-info">
          <img
            src={userData?.photoURL || DEFAULT_DP}
            alt={`${userData?.username}'s profile`}

            className="profile-pic"
            onError={(e) => (e.target.src = DEFAULT_DP)}
          />
          
          <div className="info-grid">
            <div className="info-item">
              <strong>Username:</strong> <span>{userData?.username}</span>
            </div>
            <div className="info-item">
              <strong>Email:</strong> <span>{userData?.email}</span>
            </div>
            <div className="info-item">
              <strong>Country:</strong> <span>{userData?.country}</span>
            </div>
            <div className="info-item">
              <strong>State:</strong> <span>{userData?.state}</span>
            </div>
            <div className="info-item">
              <strong>City:</strong> <span>{userData?.city}</span>
            </div>
            <div className="info-item">
              <strong>Gender:</strong> <span>{userData?.gender}</span>
            </div>
            <div className="info-item">
              <strong>Age:</strong> <span>{userData?.age}</span>
            </div>
            <div className="info-item">
              <strong>Date of Birth:</strong> <span>{userData?.dateOfBirth}</span>
            </div>
            <div className="info-item">
              <strong>Phone Number:</strong> <span>{userData?.phoneNumber}</span>
            </div>
            <div className="info-item about-you">
              <strong>About You:</strong> <span>{userData?.aboutYou}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/edit-profile")}
          className="edit-btn"
        >
          Edit Profile
        </button>
      </div>
    </>
  );
};

export default ProfileShow;
