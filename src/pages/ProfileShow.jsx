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
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            setUserData({
              ...currentUser,
              ...firestoreData,
              photoURL: firestoreData.photoURL || currentUser.photoURL || DEFAULT_DP
            });
          } else {
            setUserData({ ...currentUser, photoURL: currentUser.photoURL || DEFAULT_DP });
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

  if (loading) return <div className="profile-show-container">Loading...</div>;
  if (error) return <div className="profile-show-container"><p className="error-message">{error}</p></div>;

  return (
    <>
      {/* Background Wrapper */}
      <div className="background"></div>

      <div className="profile-show-container">
        <h2>Your Profile</h2>
        
        <div className="profile-info">
          <img 
            src={userData?.photoURL || DEFAULT_DP} 
            alt="Profile" 
            className="profile-pic" 
            onError={(e) => (e.target.src = DEFAULT_DP)} 
          />
          <p><strong>Username:</strong> {userData?.displayName || "Not set"}</p>
          <p><strong>Email:</strong> {userData?.email || "Not set"}</p>
          <p><strong>Country:</strong> {userData?.country || "Not set"}</p>
          <p><strong>State:</strong> {userData?.state || "Not set"}</p>
          <p><strong>City:</strong> {userData?.city || "Not set"}</p>
          <p><strong>Gender:</strong> {userData?.gender || "Not set"}</p>
          <p><strong>Age:</strong> {userData?.age || "Not set"}</p>
          <p><strong>Date of Birth:</strong> {userData?.dateOfBirth || "Not set"}</p>
          <p><strong>Phone Number:</strong> {userData?.phoneNumber || "Not set"}</p>
          <p><strong>About You:</strong> {userData?.aboutYou || "Not set"}</p>
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
