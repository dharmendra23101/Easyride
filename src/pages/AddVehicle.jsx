import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../css/addVehicle.css";

const AddVehicle = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [type, setType] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [preferredLocations, setPreferredLocations] = useState([]);
  const [preferredLocationInput, setPreferredLocationInput] = useState("");
  const [withDriver, setWithDriver] = useState(false);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAddPreferredLocation = () => {
    if (preferredLocationInput.trim() && !preferredLocations.includes(preferredLocationInput.trim())) {
      setPreferredLocations([...preferredLocations, preferredLocationInput.trim()]);
      setPreferredLocationInput("");
    }
  };

  const handleRemovePreferredLocation = (location) => {
    setPreferredLocations(preferredLocations.filter((loc) => loc !== location));
  };

  const handleSave = async () => {
    if (!user) {
      setError("No authenticated user found.");
      return;
    }
    if (!vehicleNumber.trim()) {
      setError("Vehicle Number is required.");
      return;
    }
    if (!type) {
      setError("Vehicle Type is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      const vehicleData = {
        userId: user.uid,
        vehicleNumber,
        type,
        country: userData.country || "Not specified",
        state: userData.state || "Not specified",
        city: userData.city || "Not specified",
        photoURL: photoURL || null,
        preferredLocations: preferredLocations.length > 0 ? preferredLocations : null,
        withDriver,
        price: price || null,
        description: description || null,
        username: user.displayName || "Anonymous",
        email: user.email || "Not available",
        phoneNumber: userData.phoneNumber || "Not available",
        createdAt: new Date().toISOString(),
        booked: false,
        bookingRequests: [], // Always initialized
      };

      await setDoc(doc(db, "vehicles", `${user.uid}_${Date.now()}`), vehicleData);
      navigate("/book");
    } catch (err) {
      setError(err.message);
      console.error("Error adding vehicle:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-vehicle-container">
      <h2>Add Your Vehicle</h2>
      {error && <p className="error-message">{error}</p>}

      <input
        type="text"
        placeholder="Vehicle Number (required)"
        value={vehicleNumber}
        onChange={(e) => setVehicleNumber(e.target.value)}
        disabled={loading}
        required
      />

      <select value={type} onChange={(e) => setType(e.target.value)} disabled={loading} required>
        <option value="">Select Vehicle Type (required)</option>
        <option value="Car">Car</option>
        <option value="Bike">Bike</option>
        <option value="Bus">Bus</option>
        <option value="Truck">Truck</option>
        <option value="Auto">Auto</option>
        <option value="Other 4-Wheeler">Other 4-Wheeler</option>
      </select>

      <input
        type="text"
        placeholder="Photo URL (optional, http/https only)"
        value={photoURL}
        onChange={(e) => setPhotoURL(e.target.value)}
        disabled={loading}
      />

      <div className="preferred-locations">
        <input
          type="text"
          placeholder="Add Preferred Location (optional)"
          value={preferredLocationInput}
          onChange={(e) => setPreferredLocationInput(e.target.value)}
          disabled={loading}
          onKeyPress={(e) => e.key === "Enter" && handleAddPreferredLocation()}
        />
        <button onClick={handleAddPreferredLocation} disabled={loading}>Add</button>
        <div className="location-list">
          {preferredLocations.map((loc) => (
            <div key={loc} className="location-item">
              {loc}
              <button onClick={() => handleRemovePreferredLocation(loc)} disabled={loading}>x</button>
            </div>
          ))}
        </div>
      </div>

      <div className="driver-option">
        <label>
          <input
            type="checkbox"
            checked={withDriver}
            onChange={(e) => setWithDriver(e.target.checked)}
            disabled={loading}
          />
          With Driver
        </label>
      </div>

      <input
        type="text"
        placeholder="Price (e.g., 1000/per 300 km)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        disabled={loading}
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={loading}
        rows="4"
      />

      <button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Vehicle"}
      </button>
    </div>
  );
};

export default AddVehicle;