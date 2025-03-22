import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"; // Removed updateDoc
import { useNavigate } from "react-router-dom";
import "../css/requestStatus.css";

const RequestStatus = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchRequests(currentUser.uid);
      } else {
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchRequests = useCallback(async (uid) => {
    setLoading(true);
    try {
      // Fetch all vehicles for reference
      const vehicleSnapshot = await getDocs(collection(db, "vehicles"));
      const allVehicles = vehicleSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Fetch user's booking requests
      const requestSnapshot = await getDocs(collection(db, "bookingRequests"));
      const userRequests = requestSnapshot.docs
        .filter((doc) => doc.data().userId === uid) // All requests by the user
        .map((doc) => {
          const vehicle = allVehicles.find((v) => v.id === doc.data().vehicleId) || {};
          return {
            requestId: doc.id,
            vehicleId: doc.data().vehicleId,
            type: vehicle.type || "Unknown",
            owner: vehicle.username || "Anonymous",
            location: `${vehicle.country || "N/A"}, ${vehicle.state || "N/A"}, ${vehicle.city || "N/A"}`,
            requestLocation: doc.data().requestLocation,
            requestedAt: doc.data().requestedAt,
            startDateTime: doc.data().startDateTime || doc.data().requestDate, // Use startDateTime if available
            endDateTime: doc.data().endDateTime,
            status: doc.data().status === "accepted" ? "booked" : doc.data().status, // Treat "accepted" as "booked"
          };
        })
        .filter((request) => ["pending", "booked"].includes(request.status)); // Only show pending or booked

      setRequests(userRequests);
    } catch (err) {
      setError("Failed to fetch requests: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRejectRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to reject and delete this request?")) {
      try {
        const requestRef = doc(db, "bookingRequests", requestId);
        await deleteDoc(requestRef);
        fetchRequests(user.uid);
        alert("Request rejected and removed!");
      } catch (err) {
        setError("Error rejecting request: " + err.message);
        console.error(err);
      }
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div className="request-status-container"><p>Loading...</p></div>;
  if (error) return <div className="request-status-container"><p className="error-message">{error}</p></div>;

  return (
    <div className="request-status-container">
      <h2>Your Request Status</h2>

      {requests.length === 0 ? (
        <p className="no-data">No requests found.</p>
      ) : (
        <div className="status-list">
          {requests.map((request) => (
            <div key={request.requestId} className={`status-card ${request.status}`}>
              <p><strong>Vehicle:</strong> {request.type}</p>
              <p><strong>Owner:</strong> {request.owner}</p>
              <p><strong>Location:</strong> {request.location}</p>
              <p><strong>Requested Location:</strong> {request.requestLocation}</p>
              <p><strong>Start Date:</strong> {formatDateTime(request.startDateTime)}</p>
              {request.status === "booked" && (
                <p><strong>End Date:</strong> {formatDateTime(request.endDateTime)}</p>
              )}
              <p><strong>Requested At:</strong> {formatDateTime(request.requestedAt)}</p>
              <p><strong>Status:</strong> {request.status.charAt(0).toUpperCase() + request.status.slice(1)}</p>
              {request.status === "pending" && (
                <button
                  onClick={() => handleRejectRequest(request.requestId)}
                  className="reject-btn"
                >
                  Reject
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestStatus;