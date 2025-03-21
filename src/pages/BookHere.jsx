import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import VehicleDetailsPopup from "./VehicleDetailsPopup";
import "../css/bookHere.css";

const BookHere = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    specificLocation: "",
    withDriver: "",
    price: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const vehiclesPerPage = 5;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) navigate("/auth");
    });

    const fetchVehicles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "vehicles"));
        const vehicleList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVehicles(vehicleList);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();

    return () => unsubscribe();
  }, [navigate]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const typeMatch = filters.type ? vehicle.type === filters.type : true;
    const locationMatch = filters.specificLocation
      ? [
          vehicle.country || "",
          vehicle.state || "",
          vehicle.city || "",
          ...(vehicle.preferredLocations || []),
        ].some((loc) => loc.toLowerCase().includes(filters.specificLocation.toLowerCase()))
      : true;
    const driverMatch =
      filters.withDriver === ""
        ? true
        : filters.withDriver === "true"
        ? vehicle.withDriver
        : !vehicle.withDriver;
    const priceMatch = filters.price
      ? vehicle.price?.toLowerCase().includes(filters.price.toLowerCase())
      : true;

    return typeMatch && locationMatch && driverMatch && priceMatch;
  });

  const indexOfLastVehicle = currentPage * vehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCardClick = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const closePopup = () => {
    setSelectedVehicle(null);
  };

  if (loading) return <div className="book">Loading...</div>;

  return (
    <div className="book">
      <h1>Book Your Ride</h1>
      <p>Select your destination and enjoy your ride!</p>

      <div className="book-container">
        <div className="filter-sidebar">
          <h2>Filters</h2>
          <div className="filter-section">
            <label>Vehicle Type</label>
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="Bus">Bus</option>
              <option value="Truck">Truck</option>
              <option value="Auto">Auto</option>
              <option value="Other 4-Wheeler">Other 4-Wheeler</option>
            </select>
          </div>
          <div className="filter-section">
            <label>Specific Location</label>
            <input
              type="text"
              name="specificLocation"
              value={filters.specificLocation}
              onChange={handleFilterChange}
              placeholder="Enter any location"
            />
          </div>
          <div className="filter-section">
            <label>Driver Option</label>
            <select name="withDriver" value={filters.withDriver} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="true">With Driver</option>
              <option value="false">Without Driver</option>
            </select>
          </div>
          <div className="filter-section">
            <label>Price</label>
            <input
              type="text"
              name="price"
              value={filters.price}
              onChange={handleFilterChange}
              placeholder="Enter price (e.g., 1000/per 300 km)"
            />
          </div>
        </div>

        <div className="vehicle-list">
          {currentVehicles.length === 0 ? (
            <p>No vehicles match your filters.</p>
          ) : (
            currentVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="vehicle-card"
                onClick={() => handleCardClick(vehicle)}
              >
                <img
                  src={vehicle.photoURL || "default-vehicle.png"}
                  alt={vehicle.type || "Vehicle"}
                  className="vehicle-pic"
                />
                <div className="vehicle-info">
                  <h3>{vehicle.type || "Unknown Type"}</h3>
                  <p><strong>Owner:</strong> {vehicle.username || "Anonymous"}</p>
                  <p><strong>Location:</strong> {vehicle.country || "N/A"}, {vehicle.state || "N/A"}, {vehicle.city || "N/A"}</p>
                  <p><strong>Price:</strong> {vehicle.price || "N/A"}</p>
                  <p><strong>Status:</strong> {vehicle.booked ? "Booked" : "Available"}</p>
                </div>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? "active" : ""}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedVehicle && (
        <VehicleDetailsPopup
          vehicle={selectedVehicle}
          currentUser={currentUser}
          onClose={closePopup}
          onVehiclesUpdate={setVehicles}
        />
      )}
    </div>
  );
};

export default BookHere;