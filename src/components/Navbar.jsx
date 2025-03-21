import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Profile from "../pages/Profile";
import "../css/navbar.css";

const DEFAULT_DP = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg9BTJHBq_39g9nGfBoHo2FlpKD4venJyYanuvqu81EBWkI8M8hHuEfkJ-YbcVphhgJU&usqp=CAU";

const Navbar = () => {
  const [user] = useAuthState(auth);
  const [username, setUsername] = useState("");
  const [photoURL, setPhotoURL] = useState(DEFAULT_DP);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const firestoreData = userSnap.data();
          setUsername(firestoreData.displayName || user.displayName || "");
          setPhotoURL(firestoreData.photoURL || user.photoURL || DEFAULT_DP);
        } else {
          setUsername(user.displayName || "");
          setPhotoURL(user.photoURL || DEFAULT_DP);
        }
      }
    };

    fetchUserProfile();

    const unsubscribe = onAuthStateChanged(auth, async (updatedUser) => {
      if (updatedUser) {
        const userRef = doc(db, "users", updatedUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const firestoreData = userSnap.data();
          setUsername(firestoreData.displayName || updatedUser.displayName || "");
          setPhotoURL(firestoreData.photoURL || updatedUser.photoURL || DEFAULT_DP);
        } else {
          setUsername(updatedUser.displayName || "");
          setPhotoURL(updatedUser.photoURL || DEFAULT_DP);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <>
      <nav className="navbar">
        <Link to="/">
          <img src="/easyridel.jpg" alt="EasyRide" className="logo" />
        </Link>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/book">Book Here</Link></li>
        </ul>

        {user ? (
          <div
            className="profile-section"
            onClick={() => setIsProfileOpen(true)}
          >
            <img 
              src={photoURL} 
              alt="User DP" 
              className="profile-pic"
              onError={(e) => (e.target.src = DEFAULT_DP)}
            />
            <span className="username">{username}</span>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/auth" className="login-btn">Login</Link>
            <Link to="/auth" className="register-btn">Register</Link>
          </div>
        )}
      </nav>

      <Profile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Navbar;
