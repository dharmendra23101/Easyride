import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDocs, deleteDoc, doc, updateDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../css/editVehicles.css";

const EditVehicles = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchVehicles(currentUser.uid);
      } else {
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchVehicles = async (uid) => {
    setLoading(true);
    try {
      // Fetch user's vehicles
      const vehicleSnapshot = await getDocs(collection(db, "vehicles"));
      const requestSnapshot = await getDocs(collection(db, "bookingRequests"));

      const userVehicles = vehicleSnapshot.docs
        .filter((doc) => doc.data().userId === uid)
        .map((doc) => {
          // Fetch booking requests for this vehicle
          const requests = requestSnapshot.docs
            .filter((req) => req.data().vehicleId === doc.id)
            .map((req) => ({ id: req.id, ...req.data() }));
          return { id: doc.id, ...doc.data(), bookingRequests: requests };
        });

      setVehicles(userVehicles);
    } catch (err) {
      setError("Failed to fetch vehicles: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        // Delete the vehicle
        await deleteDoc(doc(db, "vehicles", vehicleId));
        // Optionally delete associated booking requests (if desired)
        const requestSnapshot = await getDocs(collection(db, "bookingRequests"));
        const requestsToDelete = requestSnapshot.docs.filter((doc) => doc.data().vehicleId === vehicleId);
        for (const req of requestsToDelete) {
          await deleteDoc(doc(db, "bookingRequests", req.id));
        }
        fetchVehicles(user.uid);
      } catch (err) {
        setError("Error deleting vehicle: " + err.message);
        console.error(err);
      }
    }
  };

  const handleAcceptRequest = async (vehicleId, request) => {
    try {
      const vehicleRef = doc(db, "vehicles", vehicleId);
      const requestRef = doc(db, "bookingRequests", request.id);

      const updatedVehicleData = {
        booked: true,
        bookedBy: {
          userId: request.userId,
          username: request.username,
          email: request.email || "Not available",
          phoneNumber: request.phoneNumber || "Not available",
          country: request.country || "Not specified",
          city: request.city || "Not specified",
          bookedAt: new Date().toISOString(),
          requestedLocation: request.requestLocation,
          requestedDate: request.requestDate,
        },
      };

      // Update vehicle to mark it as booked
      await updateDoc(vehicleRef, updatedVehicleData);
      // Update request status to accepted
      await updateDoc(requestRef, { status: "accepted" });

      fetchVehicles(user.uid);
      alert("Request accepted and vehicle booked!");
    } catch (err) {
      setError("Error accepting request: " + err.message);
      console.error(err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const requestRef = doc(db, "bookingRequests", requestId);
      await deleteDoc(requestRef);
      fetchVehicles(user.uid);
      alert("Request rejected and removed!");
    } catch (err) {
      setError("Error rejecting request: " + err.message);
      console.error(err);
    }
  };

  return (
    <div className="edit-vehicles-container">
      <h2>Edit Your Vehicles</h2>
      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <p>No vehicles found. Add one below!</p>
      ) : (
        <div className="vehicles-list">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-item">
              <img
                src={vehicle.photoURL || "default-vehicle.png"}
                alt={vehicle.type || "Vehicle"}
                className="vehicle-image"
              />
              <p><strong>Type:</strong> {vehicle.type || "N/A"}</p>
              <p><strong>Vehicle Number:</strong> {vehicle.vehicleNumber || "N/A"}</p>
              <p><strong>Location:</strong> {vehicle.country || "N/A"}, {vehicle.state || "N/A"}, {vehicle.city || "N/A"}</p>
              <p><strong>Preferred Locations:</strong> {vehicle.preferredLocations?.join(", ") || "N/A"}</p>
              <p><strong>Driver:</strong> {vehicle.withDriver ? "With Driver" : "Without Driver"}</p>
              <p><strong>Price:</strong> {vehicle.price || "N/A"}</p>
              <p><strong>Description:</strong> {vehicle.description || "N/A"}</p>
              <p><strong>Status:</strong> {vehicle.booked ? "Booked" : "Available"}</p>
              {vehicle.booked && vehicle.bookedBy && (
                <div className="booked-info">
                  <p><strong>Booked By:</strong> {vehicle.bookedBy.username}</p>
                  <p><strong>Country:</strong> {vehicle.bookedBy.country}</p>
                  <p><strong>City:</strong> {vehicle.bookedBy.city}</p>
                  <p><strong>Email:</strong> {vehicle.bookedBy.email}</p>
                  <p><strong>Phone:</strong> {vehicle.bookedBy.phoneNumber}</p>
                  <p><strong>Booked At:</strong> {new Date(vehicle.bookedBy.bookedAt).toLocaleString()}</p>
                  <p><strong>Requested Location:</strong> {vehicle.bookedBy.requestedLocation}</p>
                  <p><strong>Requested Date:</strong> {vehicle.bookedBy.requestedDate}</p>
                </div>
              )}
              {vehicle.bookingRequests && vehicle.bookingRequests.length > 0 && (
                <div className="requests-section">
                  <h3>Booking Requests</h3>
                  {vehicle.bookingRequests.map((request) => (
                    <div key={request.id} className="request-item">
                      <p><strong>Requester:</strong> {request.username}</p>
                      <p><strong>Location:</strong> {request.requestLocation}</p>
                      <p><strong>Date:</strong> {request.requestDate}</p>
                      <p><strong>Status:</strong> {request.status}</p>
                      {request.status === "pending" && !vehicle.booked && (
                        <div className="request-actions">
                          <button
                            onClick={() => handleAcceptRequest(vehicle.id, request)}
                            className="accept-btn"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="reject-btn"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => handleDelete(vehicle.id)} className="delete-btn">Delete</button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate("/add-vehicle")}
        className="add-vehicle-btn"
        disabled={loading}
      >
        Add Your Vehicle
      </button>
    </div>
  );
};

export default EditVehicles;