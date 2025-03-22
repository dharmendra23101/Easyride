import { useState } from "react";
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth"; // Import updateProfile
import { useNavigate } from "react-router-dom";
import "../css/auth.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Login successful");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update the user's displayName in Firebase Auth
        await updateProfile(user, { displayName: username });
        
        // Save username to Firestore
        await setDoc(doc(db, "users", user.uid), {
          username: username,
          email: email,
          createdAt: new Date().toISOString(),
        }, { merge: true });

        console.log("User registered, username set in Auth and Firestore for UID:", user.uid);
      }
      navigate("/");
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-header">
          <img src="/easyridel.jpg" alt="Authentication" className="auth-image" />
          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p className="auth-subtitle">
            {isLogin ? "Sign in to continue" : "Join us today"}
          </p>
        </div>

        {error && <p className="error-message">{error}</p>}

        {!isLogin && (
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}

        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-button">
          {isLogin ? "Sign In" : "Sign Up"}
        </button>

        <p className="switch-form">
          {isLogin ? "New to EasyRide?" : "Already have an account?"}{" "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create an account" : "Sign in"}
          </span>
        </p>
      </form>
    </div>
  );
};

export default Auth;