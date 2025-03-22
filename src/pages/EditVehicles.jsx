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
import DefaultImage from "../assets/default-vehicle.jpg"; // Ensure this file exists in src/assets/
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
    setExpandedRequests(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
  };
  
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Not specified";
    try {
      return new Date(dateTimeString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
      {error && <p className="error-message"><i className="fa fa-exclamation-circle"></i> {error}</p>}

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa fa-car"></i></div>
          <h3>No Vehicles Found</h3>
          <p>Add your first vehicle to start receiving booking requests!</p>
          <button onClick={() => navigate("/add-vehicle")} className="add-vehicle-btn">
            <i className="fa fa-plus"></i> Add Your Vehicle
          </button>
        </div>
      ) : (
        <>
          <div className="vehicles-list">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="vehicle-item">
                <div className={`vehicle-status-badge ${vehicle.booked ? 'status-booked' : 'status-available'}`}>
                  {vehicle.booked ? 'Booked' : 'Available'}
                </div>
                
                <img
                  src={resolvePhotoURL(vehicle)}
                  alt={vehicle.type || "Vehicle"}
                  className="vehicle-image"
                  onError={(e) => { e.target.src = DefaultImage; }} // Use imported DefaultImage
                />
                
                <h3>{vehicle.type || "Unknown Type"}</h3>
                
                <p>
                  <i className="fa fa-id-card vehicle-detail-icon"></i>
                  <strong>Vehicle Number:</strong> {vehicle.vehicleNumber || "N/A"}
                </p>
                
                <p>
                  <i className="fa fa-map-marker vehicle-detail-icon"></i>
                  <strong>Location:</strong> {[vehicle.city, vehicle.state, vehicle.country].filter(Boolean).join(", ") || "N/A"}
                </p>
                
                <p>
                  <i className="fa fa-map vehicle-detail-icon"></i>
                  <strong>Preferred Locations:</strong> {vehicle.preferredLocations?.join(", ") || "N/A"}
                </p>
                
                <p>
                  <i className="fa fa-user vehicle-detail-icon"></i>
                  <strong>Driver:</strong> {vehicle.withDriver ? "With Driver" : "Self-Drive"}
                </p>
                
                <p>
                  <i className="fa fa-tag vehicle-detail-icon"></i>
                  <strong>Price:</strong> {vehicle.price || "N/A"}
                </p>
                
                <p>
                  <i className="fa fa-file-text-o vehicle-detail-icon"></i>
                  <strong>Description:</strong> {vehicle.description || "N/A"}
                </p>
                
                {vehicle.booked && vehicle.bookedBy && (
                  <div className="booked-info">
                    <h3><i className="fa fa-calendar-check-o"></i> Booking Information</h3>
                    <div className="booking-details-grid">
                      <p><strong>Username:</strong> {vehicle.bookedBy.username}</p>
                      <p><strong>Email:</strong> {vehicle.bookedBy.email}</p>
                      <p><strong>Phone:</strong> {vehicle.bookedBy.phoneNumber}</p>
                      <p><strong>Location:</strong> {[vehicle.bookedBy.city, vehicle.bookedBy.country].filter(Boolean).join(", ")}</p>
                      <p><strong>Request Location:</strong> {vehicle.bookedBy.requestedLocation}</p>
                      <p><strong>Booked At:</strong> {formatDateTime(vehicle.bookedBy.bookedAt)}</p>
                      <p><strong>Start Date/Time:</strong> {formatDateTime(vehicle.bookedBy.startDateTime)}</p>
                      <p><strong>End Date/Time:</strong> {formatDateTime(vehicle.bookedBy.endDateTime)}</p>
                    </div>
                    <button 
                      className="reject-btn" 
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setCancelModalOpen(true);
                      }}
                      style={{ marginTop: "1rem" }}
                    >
                      <i className="fa fa-times"></i> Cancel Booking
                    </button>
                  </div>
                )}
                
                {vehicle.bookingRequests && vehicle.bookingRequests.filter(r => r.status === "pending").length > 0 && (
                  <div className="requests-section">
                    <h3 onClick={() => toggleRequestExpansion(vehicle.id)} style={{ cursor: "pointer" }}>
                      <i className="fa fa-clock-o"></i> Pending Requests
                      <span className="request-count-badge">
                        {vehicle.bookingRequests.filter(r => r.status === "pending").length}
                      </span>
                      <i className={`fa fa-chevron-${expandedRequests[vehicle.id] ? 'up' : 'down'}`} style={{ marginLeft: "auto" }}></i>
                    </h3>
                    
                    {expandedRequests[vehicle.id] && vehicle.bookingRequests
                      .filter(request => request.status === "pending")
                      .map((request) => (
                        <div key={request.id} className="request-item">
                          <h4>Request from {request.username}</h4>
                          <div className="request-details">
                            <p><strong>Email:</strong> {request.email}</p>
                            <p><strong>Phone:</strong> {request.phoneNumber}</p>
                            <p><strong>Location:</strong> {[request.city, request.country].filter(Boolean).join(", ")}</p>
                            <p><strong>Request Location:</strong> {request.requestLocation}</p>
                            <p><strong>Start Date/Time:</strong> {formatDateTime(request.startDateTime)}</p>
                            <p><strong>End Date/Time:</strong> {formatDateTime(request.endDateTime)}</p>
                            <p><strong>Requested At:</strong> {formatDateTime(request.requestedAt)}</p>
                            <p>
                              <strong>Status:</strong> 
                              <span className="request-status status-pending">Pending</span>
                            </p>
                          </div>
                          
                          {!vehicle.booked && (
                            <div className="request-actions">
                              <button
                                onClick={() => handleAcceptRequest(vehicle.id, request)}
                                className="accept-btn"
                              >
                                <i className="fa fa-check"></i> Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="reject-btn"
                              >
                                <i className="fa fa-times"></i> Reject
                              </button>
                            </div>
                          )}
                        </div>
                    ))}
                  </div>
                )}
                
                <div className="vehicle-actions">
                  <button 
                    onClick={() => navigate(`/edit-vehicle/${vehicle.id}`)} 
                    className="edit-btn"
                  >
                    <i className="fa fa-pencil"></i> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(vehicle.id)} 
                    className="delete-btn"
                  >
                    <i className="fa fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => navigate("/add-vehicle")}
            className="add-vehicle-btn"
          >
            <i className="fa fa-plus"></i> Add New Vehicle
          </button>
        </>
      )}

      {cancelModalOpen && selectedVehicle && (
        <div className="popup-overlay">
          <div className="popup-content" style={{ maxWidth: "500px" }}>
            <h3>Cancel Booking Confirmation</h3>
            <p>Are you sure you want to cancel the booking for your {selectedVehicle.type}?</p>
            <p>The vehicle will be marked as available again.</p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button 
                onClick={() => handleCancelBooking(selectedVehicle.id)}
                className="accept-btn"
                style={{ flex: "1" }}
              >
                Yes, Cancel Booking
              </button>
              <button 
                onClick={() => {
                  setCancelModalOpen(false);
                  setSelectedVehicle(null);
                }}
                className="reject-btn"
                style={{ flex: "1" }}
              >
                No, Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditVehicles;