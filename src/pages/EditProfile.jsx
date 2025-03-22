import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { updateProfile, onAuthStateChanged, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ProfileShow from "./ProfileShow";
import "../css/editProfile.css";

const countryCodes = [
  "+1 (USA)", "+1 (Canada)", "+91 (India)", "+44 (UK)", "+33 (France)",
  "+49 (Germany)", "+81 (Japan)", "+86 (China)", "+61 (Australia)", "+55 (Brazil)"
];

const EditProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [username, setUsername] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [aboutYou, setAboutYou] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadUserData(currentUser);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadUserData = async (currentUser) => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUsername(data.displayName || currentUser.displayName || "");
        setPhotoURL(data.photoURL || currentUser.photoURL || "");
        setCountry(data.country || "");
        setState(data.state || "");
        setCity(data.city || "");
        setGender(data.gender || "");
        setAge(data.age ? String(data.age) : "");
        setDateOfBirth(data.dateOfBirth || "");
        if (data.phoneNumber) {
          const [code, number] = data.phoneNumber.split(" ");
          setPhoneCode(countryCodes.find(c => c.startsWith(code)) || "");
          setPhoneNumber(number || "");
        }
        setEmail(currentUser.email || "");
        setAboutYou(data.aboutYou || "");
      } else {
        setUsername(currentUser.displayName || "");
        setPhotoURL(currentUser.photoURL || "");
        setEmail(currentUser.email || "");
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Failed to load user data.");
    }
  };

  const isValidURL = (str) => {
    try {
      new URL(str);
      return str.startsWith("http");
    } catch {
      return false;
    }
  };

  const handleSave = async (field) => {
    if (!user) {
      setError("No authenticated user found.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let updatesMade = false;
      const firestoreData = {};

      if (field === "photoURL" && photoURL && photoURL !== user.photoURL) {
        if (!isValidURL(photoURL)) {
          throw new Error("Please enter a valid image URL starting with http or https.");
        }
        await updateProfile(user, { photoURL });
        firestoreData.photoURL = photoURL;
        updatesMade = true;
      }
      if (field === "location") {
        if (country.trim()) firestoreData.country = country;
        if (state.trim()) firestoreData.state = state;
        if (city.trim()) firestoreData.city = city;
        updatesMade = true;
      }
      if (field === "contacts") {
        if (phoneCode && phoneNumber) {
          firestoreData.phoneNumber = `${phoneCode.split(" ")[0]} ${phoneNumber}`;
          updatesMade = true;
        }
      }
      if (field === "ageBirth") {
        if (age) firestoreData.age = parseInt(age, 10);
        if (dateOfBirth) firestoreData.dateOfBirth = dateOfBirth;
        updatesMade = true;
      }
      if (field === "aboutYou" && aboutYou.trim()) {
        firestoreData.aboutYou = aboutYou;
        updatesMade = true;
      }

      if (Object.keys(firestoreData).length > 0) {
        await setDoc(doc(db, "users", user.uid), firestoreData, { merge: true });
        updatesMade = true;
      }

      if (updatesMade) {
        await auth.currentUser.reload();
        setUser(auth.currentUser);
      }
    } catch (error) {
      console.error("Error updating profile:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Prompt for re-authentication (if needed)
      const password = window.prompt("Please enter your password to confirm account deletion:");
      if (!password) {
        throw new Error("Password required for re-authentication.");
      }
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Step 2: Delete user's vehicles
      const vehiclesQuery = query(collection(db, "vehicles"), where("userId", "==", user.uid));
      const vehiclesSnapshot = await getDocs(vehiclesQuery);
      const deleteVehiclePromises = vehiclesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deleteVehiclePromises);

      // Step 3: Delete user's booking requests
      const requestsQuery = query(collection(db, "bookingRequests"), where("userId", "==", user.uid));
      const requestsSnapshot = await getDocs(requestsQuery);
      const deleteRequestPromises = requestsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deleteRequestPromises);

      // Step 4: Delete user document from Firestore
      await deleteDoc(doc(db, "users", user.uid));

      // Step 5: Delete Firebase Auth user
      await deleteUser(user);

      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error.message);
      setError("Failed to delete account: " + error.message);
      if (error.code === "auth/requires-recent-login") {
        setError("Please log out and log back in, then try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileShow />;
      case "editDp":
        return (
          <div className="content-section">
            <h3>Edit Display Picture</h3>
            <input
              type="text"
              placeholder="Profile Picture URL (http/https only)"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              disabled={loading}
            />
            <button onClick={() => handleSave("photoURL")} disabled={loading}>
              {loading ? "Saving..." : "Save DP"}
            </button>
          </div>
        );
      case "contacts":
        return (
          <div className="content-section">
            <h3>Edit Contacts</h3>
            <input
              type="email"
              placeholder="Email (cannot be changed here)"
              value={email}
              disabled={true}
            />
            <div className="phone-container">
              <select
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                disabled={loading}
              >
                <option value="">Select Country Code</option>
                {countryCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
            </div>
            <button onClick={() => handleSave("contacts")} disabled={loading}>
              {loading ? "Saving..." : "Save Contacts"}
            </button>
          </div>
        );
      case "location":
        return (
          <div className="content-section">
            <h3>Edit Location</h3>
            <input
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={loading}
            />
            <button onClick={() => handleSave("location")} disabled={loading}>
              {loading ? "Saving..." : "Save Location"}
            </button>
          </div>
        );
      case "ageBirth":
        return (
          <div className="content-section">
            <h3>Edit Age & Birth Date</h3>
            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="1"
              max="150"
              disabled={loading}
            />
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={loading}
            />
            <button onClick={() => handleSave("ageBirth")} disabled={loading}>
              {loading ? "Saving..." : "Save Age & Birth Date"}
            </button>
          </div>
        );
      case "aboutYou":
        return (
          <div className="content-section">
            <h3>Update About You</h3>
            <textarea
              placeholder="About You"
              value={aboutYou}
              onChange={(e) => setAboutYou(e.target.value)}
              disabled={loading}
              rows="4"
            />
            <button onClick={() => handleSave("aboutYou")} disabled={loading}>
              {loading ? "Saving..." : "Save About You"}
            </button>
          </div>
        );
      case "changePassword":
        return (
          <div className="content-section">
            <h3>Change Password</h3>
            <p>Password change is not implemented here. Use the Forgot Password link on the login page.</p>
          </div>
        );
      case "deleteAccount":
        return (
          <div className="content-section">
            <h3>Delete Account</h3>
            <p>Clicking below will permanently delete your account and all associated data.</p>
            <button onClick={handleDeleteAccount} disabled={loading} className="delete-btn">
              {loading ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="edit-profile-wrapper">
      <div className="sidebar">
        <h2>Options</h2>
        <ul>
          <li onClick={() => setActiveSection("profile")}>Your Profile</li>
          <li onClick={() => setActiveSection("editDp")}>Edit DP</li>
          <li onClick={() => setActiveSection("contacts")}>Contacts</li>
          <li onClick={() => setActiveSection("location")}>Location</li>
          <li onClick={() => setActiveSection("ageBirth")}>Age & Birth Date</li>
          <li onClick={() => setActiveSection("aboutYou")}>About You</li>
          <li onClick={() => setActiveSection("changePassword")}>Change Password</li>
          <li onClick={() => setActiveSection("deleteAccount")}>Delete Account</li>
        </ul>
      </div>
      <div className="content-area">
        {error && <p className="error-message">{error}</p>}
        {renderContent()}
      </div>
    </div>
  );
};

export default EditProfile;