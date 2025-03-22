import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDocs, deleteDoc, doc, updateDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BikeImage from "../assets/BIKE.jpeg";
import BusImage from "../assets/BUS.jpeg";
import CarImage from "../assets/CAR.jpeg";
import TruckImage from "../assets/TRUCK.jpeg";
import AutoImage from "../assets/AUTO.jpeg";
import OtherImage from "../assets/OTHER.jpeg";
import DefaultImage from "../assets/default-vehicle.jpg";
import "../css/editVehicles.css";

const EditVehicles = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [expandedRequests, setExpandedRequests] = useState({});

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
      const vehicleSnapshot = await getDocs(collection(db, "vehicles"));
      const requestSnapshot = await getDocs(collection(db, "bookingRequests"));

      const userVehicles = vehicleSnapshot.docs
        .filter((doc) => doc.data().userId === uid)
        .map((doc) => {
          const requests = requestSnapshot.docs
            .filter((req) => req.data().vehicleId === doc.id)
            .map((req) => ({ id: req.id, ...req.data() }));
          return { 
            id: doc.id, 
            ...doc.data(), 
            bookingRequests: requests 
          };
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
        await deleteDoc(doc(db, "vehicles", vehicleId));
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
          startDateTime: request.startDateTime,
          endDateTime: request.endDateTime,
        },
      };

      await updateDoc(vehicleRef, updatedVehicleData);
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

  const handleCancelBooking = async (vehicleId) => {
    try {
      const vehicleRef = doc(db, "vehicles", vehicleId);
      await updateDoc(vehicleRef, {
        booked: false,
        bookedBy: null,
      });
      setCancelModalOpen(false);
      setSelectedVehicle(null);
      fetchVehicles(user.uid);
    } catch (err) {
      setError("Error canceling booking: " + err.message);
      console.error(err);
    }
  };

  const toggleRequestExpansion = (vehicleId) => {
    setExpandedRequests((prev) => ({
      ...prev,
      [vehicleId]: !prev[vehicleId],
    }));
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Not specified";
    try {
      return new Date(dateTimeString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getPhotoURL = (vehicleType) => {
    switch (vehicleType) {
      case "Bike": return BikeImage;
      case "Bus": return BusImage;
      case "Car": return CarImage;
      case "Truck": return TruckImage;
      case "Auto": return AutoImage;
      case "Other 4-Wheeler": return OtherImage;
      default: return DefaultImage;
    }
  };

  const resolvePhotoURL = (vehicle) => {
    if (!vehicle.photoURL || vehicle.photoURL === "default-vehicle.png") {
      return getPhotoURL(vehicle.type);
    }
    return vehicle.photoURL.startsWith("http") ? vehicle.photoURL : getPhotoURL(vehicle.type);
  };

  if (loading) {
    return (
      <div className="edit-vehicles-container loading-container">
        <div className="loader"></div>
        <p>Loading your vehicles...</p>
      </div>
    );
  }

  return (
    <div className="edit-vehicles-container">
      <h2>Manage Vehicles</h2>
      {error && <p className="error-message">{error}</p>}

      {vehicles.length === 0 ? (
        <div className="no-data">
          <p>No vehicles found. Add one to get started!</p>
          <button onClick={() => navigate("/add-vehicle")} className="add-btn">
            Add Vehicle
          </button>
        </div>
      ) : (
        <div className="vehicle-list">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <img
                src={resolvePhotoURL(vehicle)}
                alt={vehicle.type}
                className="vehicle-img"
                onError={(e) => (e.target.src = DefaultImage)}
              />
              <div className="vehicle-details">
                <h3>{vehicle.type}</h3>
                <p><strong>Number:</strong> {vehicle.vehicleNumber}</p>
                <p><strong>Location:</strong> {`${vehicle.city}, ${vehicle.state}, ${vehicle.country}`}</p>
                <p><strong>Price:</strong> {vehicle.price || "N/A"}</p>
                {vehicle.booked && (
                  <div className="booking-info">
                    <p><strong>Booked By:</strong> {vehicle.bookedBy.username}</p>
                    <p><strong>Start:</strong> {formatDateTime(vehicle.bookedBy.startDateTime)}</p>
                    <button
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setCancelModalOpen(true);
                      }}
                      className="cancel-btn"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
                {vehicle.bookingRequests?.length > 0 && (
                  <div className="requests">
                    <h4 onClick={() => toggleRequestExpansion(vehicle.id)} className="requests-toggle">
                      Requests ({vehicle.bookingRequests.length})
                      <span>{expandedRequests[vehicle.id] ? "▲" : "▼"}</span>
                    </h4>
                    {expandedRequests[vehicle.id] && vehicle.bookingRequests.map((req) => (
                      <div key={req.id} className="request-card">
                        <p><strong>User:</strong> {req.username}</p>
                        <p><strong>Location:</strong> {req.requestLocation}</p>
                        <p><strong>Start:</strong> {formatDateTime(req.startDateTime)}</p>
                        <div className="request-actions">
                          {!vehicle.booked && (
                            <>
                              <button onClick={() => handleAcceptRequest(vehicle.id, req)} className="accept-btn">
                                Accept
                              </button>
                              <button onClick={() => handleRejectRequest(req.id)} className="reject-btn">
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="vehicle-actions">
                  <button onClick={() => navigate(`/edit-vehicle/${vehicle.id}`)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(vehicle.id)} className="delete-btn">Delete</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => navigate("/add-vehicle")} className="add-btn">Add New Vehicle</button>
        </div>
      )}

      {cancelModalOpen && selectedVehicle && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm Cancellation</h3>
            <p>Cancel booking for {selectedVehicle.type}?</p>
            <div className="modal-actions">
              <button onClick={() => handleCancelBooking(selectedVehicle.id)} className="confirm-btn">Yes</button>
              <button onClick={() => setCancelModalOpen(false)} className="cancel-btn">No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditVehicles;