import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"; // Changed updateDoc to deleteDoc
import { useNavigate } from "react-router-dom";
import "../css/requestStatus.css";

const RequestStatus = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [bookedVehicles, setBookedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchRequestsAndBookings(currentUser.uid);
      } else {
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchRequestsAndBookings = async (uid) => {
    setLoading(true);
    try {
      // Fetch all vehicles
      const vehicleSnapshot = await getDocs(collection(db, "vehicles"));
      const allVehicles = vehicleSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Fetch all booking requests for the user
      const requestSnapshot = await getDocs(collection(db, "bookingRequests"));
      const userRequests = requestSnapshot.docs
        .filter((doc) => doc.data().userId === uid && doc.data().status === "pending")
        .map((doc) => {
          const vehicle = allVehicles.find((v) => v.id === doc.data().vehicleId) || {};
          return {
            requestId: doc.id, // Store request ID for deletion
            vehicleId: doc.data().vehicleId,
            type: vehicle.type || "Unknown",
            owner: vehicle.username || "Anonymous",
            location: `${vehicle.country || "N/A"}, ${vehicle.state || "N/A"}, ${vehicle.city || "N/A"}`,
            requestLocation: doc.data().requestLocation,
            requestDate: doc.data().requestDate,
            requestedAt: doc.data().requestedAt,
            status: "pending",
          };
        });

      // Fetch booked vehicles
      const userBookings = allVehicles
        .filter((vehicle) => 
          vehicle.booked && 
          vehicle.bookedBy && 
          vehicle.bookedBy.userId === uid
        )
        .map((vehicle) => ({
          vehicleId: vehicle.id,
          type: vehicle.type,
          owner: vehicle.username,
          location: `${vehicle.country}, ${vehicle.state}, ${vehicle.city}`,
          requestLocation: vehicle.bookedBy.requestedLocation,
          requestDate: vehicle.bookedBy.requestedDate,
          bookedAt: vehicle.bookedBy.bookedAt,
          status: "booked",
        }))
        .filter((booking) => {
          const requestDate = new Date(booking.requestDate);
          const today = new Date();
          return requestDate >= today;
        });

      setRequests(userRequests);
      setBookedVehicles(userBookings);
    } catch (err) {
      setError("Failed to fetch requests/bookings: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to reject and delete this request?")) {
      try {
        const requestRef = doc(db, "bookingRequests", requestId);
        await deleteDoc(requestRef);
        fetchRequestsAndBookings(user.uid);
        alert("Request rejected and removed!");
      } catch (err) {
        setError("Error rejecting request: " + err.message);
        console.error(err);
      }
    }
  };

  const handleDeleteBooking = async (vehicleId, requestDate) => {
    const requestDateObj = new Date(requestDate);
    const today = new Date();
    const diffTime = requestDateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      alert("You can only delete a booking more than 3 days before the requested date.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        const vehicleRef = doc(db, "vehicles", vehicleId);
        await updateDoc(vehicleRef, {
          booked: false,
          bookedBy: null,
        });
        fetchRequestsAndBookings(user.uid);
        alert("Booking deleted and vehicle status updated!");
      } catch (err) {
        setError("Error deleting booking: " + err.message);
        console.error(err);
      }
    }
  };

  if (loading) return <div className="request-status-container">Loading...</div>;
  if (error) return <div className="request-status-container"><p className="error-message">{error}</p></div>;

  return (
    <div className="request-status-container">
      <h2>Your Request Status</h2>

      {(requests.length === 0 && bookedVehicles.length === 0) ? (
        <p>No requests or bookings found.</p>
      ) : (
        <div className="status-list">
          {requests.map((request) => (
            <div key={request.requestId} className="status-card">
              <p><strong>Vehicle:</strong> {request.type}</p>
              <p><strong>Owner:</strong> {request.owner}</p>
              <p><strong>Location:</strong> {request.location}</p>
              <p><strong>Requested Location:</strong> {request.requestLocation}</p>
              <p><strong>Requested Date:</strong> {request.requestDate}</p>
              <p><strong>Status:</strong> Pending</p>
              <button
                onClick={() => handleRejectRequest(request.requestId)}
                className="reject-btn"
              >
                Reject
              </button>
            </div>
          ))}

          {bookedVehicles.map((booking, index) => {
            const requestDate = new Date(booking.requestDate);
            const today = new Date();
            const diffDays = Math.ceil((requestDate - today) / (1000 * 60 * 60 * 24));

            return (
              <div key={index} className="status-card">
                <p><strong>Vehicle:</strong> {booking.type}</p>
                <p><strong>Owner:</strong> {booking.owner}</p>
                <p><strong>Location:</strong> {booking.location}</p>
                <p><strong>Requested Location:</strong> {booking.requestLocation}</p>
                <p><strong>Requested Date:</strong> {booking.requestDate}</p>
                <p><strong>Booked At:</strong> {new Date(booking.bookedAt).toLocaleString()}</p>
                <p><strong>Status:</strong> Booked</p>
                {diffDays > 3 && (
                  <button
                    onClick={() => handleDeleteBooking(booking.vehicleId, booking.requestDate)}
                    className="delete-btn"
                  >
                    Delete Booking
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestStatus;