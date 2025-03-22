// BookHere.jsx
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import VehicleDetailsPopup from "./VehicleDetailsPopup";
import BikeImage from "../assets/BIKE.jpeg";
import BusImage from "../assets/BUS.jpeg";
import CarImage from "../assets/CAR.jpeg";
import TruckImage from "../assets/TRUCK.jpeg";
import AutoImage from "../assets/AUTO.jpeg";
import OtherImage from "../assets/OTHER.jpeg";
import DefaultImage from "../assets/default-vehicle.jpg";
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
    sortBy: "default",
    availability: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const vehiclesPerPage = 6;

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

  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchMatch = searchQuery
      ? [
          vehicle.type || "",
          vehicle.username || "",
          vehicle.country || "",
          vehicle.state || "",
          vehicle.city || "",
          ...(vehicle.preferredLocations || []),
          vehicle.price || "",
        ].some((field) =>
          field.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true;

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
    
    const availabilityMatch =
      filters.availability === ""
        ? true
        : filters.availability === "available"
        ? !vehicle.booked
        : vehicle.booked;

    return searchMatch && typeMatch && locationMatch && driverMatch && priceMatch && availabilityMatch;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (filters.sortBy) {
      case "price-low-high":
        return (parseFloat(a.price?.replace(/[^\d.]/g, '')) || 0) - 
               (parseFloat(b.price?.replace(/[^\d.]/g, '')) || 0);
      case "price-high-low":
        return (parseFloat(b.price?.replace(/[^\d.]/g, '')) || 0) - 
               (parseFloat(a.price?.replace(/[^\d.]/g, '')) || 0);
      case "newest":
        return (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0));
      case "name-a-z":
        return (a.type || "").localeCompare(b.type || "");
      case "name-z-a":
        return (b.type || "").localeCompare(a.type || "");
      default:
        return 0;
    }
  });

  const indexOfLastVehicle = currentPage * vehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
  const currentVehicles = sortedVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
  const totalPages = Math.ceil(sortedVehicles.length / vehiclesPerPage);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      type: "",
      specificLocation: "",
      withDriver: "",
      price: "",
      sortBy: "default",
      availability: "",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCardClick = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const closePopup = () => {
    setSelectedVehicle(null);
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  if (loading) {
    return (
      <div className="book loading-container">
        <div className="loader"></div>
        <p>Loading available vehicles...</p>
      </div>
    );
  }

  return (
    <div className="book">
      <div className="book-header">
        <h1>Premium Vehicle Rentals</h1>
        <p>Find your perfect ride and explore with freedom and comfort</p>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for vehicles, locations, or owners..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button className="search-button">
            <i className="fa fa-search"></i>
          </button>
        </div>
        
        <div className="mobile-filter-toggle">
          <button onClick={toggleMobileFilters}>
            {showMobileFilters ? "Hide Filters" : "Show Filters"} <i className="fa fa-filter"></i>
          </button>
        </div>
      </div>

      <div className="book-container">
        <div className={`filter-sidebar ${showMobileFilters ? 'mobile-visible' : ''}`}>
          <div className="filter-header">
            <h2>Refine Your Search</h2>
            <button className="clear-filters" onClick={handleClearFilters}>
              Clear All
            </button>
          </div>
          
          <div className="filter-section">
            <label>Sort By</label>
            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="select-control">
              <option value="default">Default</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="name-a-z">Name: A to Z</option>
              <option value="name-z-a">Name: Z to A</option>
            </select>
          </div>
          
          <div className="filter-section">
            <label>Vehicle Type</label>
            <select name="type" value={filters.type} onChange={handleFilterChange} className="select-control">
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
            <label>Location</label>
            <input
              type="text"
              name="specificLocation"
              value={filters.specificLocation}
              onChange={handleFilterChange}
              placeholder="City, state, or country"
              className="input-control"
            />
          </div>
          
          <div className="filter-section">
            <label>Driver Option</label>
            <select name="withDriver" value={filters.withDriver} onChange={handleFilterChange} className="select-control">
              <option value="">All Options</option>
              <option value="true">With Driver</option>
              <option value="false">Self-Drive</option>
            </select>
          </div>
          
          <div className="filter-section">
            <label>Price Range</label>
            <input
              type="text"
              name="price"
              value={filters.price}
              onChange={handleFilterChange}
              placeholder="Enter price (e.g., 1000)"
              className="input-control"
            />
          </div>
          
          <div className="filter-section">
            <label>Availability</label>
            <select name="availability" value={filters.availability} onChange={handleFilterChange} className="select-control">
              <option value="">All</option>
              <option value="available">Available Now</option>
              <option value="booked">Currently Booked</option>
            </select>
          </div>
          
          <div className="filter-footer">
            <p className="result-count">{sortedVehicles.length} vehicles found</p>
          </div>
        </div>

        <div className="vehicle-list">
          {currentVehicles.length === 0 ? (
            <div className="no-results">
              <i className="fa fa-search-minus"></i>
              <h3>No vehicles match your search</h3>
              <p>Try adjusting your filters or search terms</p>
              <button onClick={handleClearFilters} className="reset-search-btn">Reset Search</button>
            </div>
          ) : (
            <div className="vehicle-grid">
              {currentVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="vehicle-card"
                  onClick={() => handleCardClick(vehicle)}
                >
                  <div className="vehicle-image-container">
                    <img
                      src={resolvePhotoURL(vehicle)}
                      alt={vehicle.type || "Vehicle"}
                      className="vehicle-pic"
                      onError={(e) => { e.target.src = DefaultImage; }}
                    />
                  </div>
                  
                  <div className="vehicle-info">
                    <h3 className="vehicle-title">{vehicle.type || "Unknown Type"}</h3>
                    
                    <div className="vehicle-details">
                      <div className="detail-item">
                        <i className="fa fa-user"></i>
                        <span>{vehicle.username || "Anonymous"}</span>
                      </div>
                      
                      <div className="detail-item">
                        <i className="fa fa-map-marker"></i>
                        <span>
                          {[vehicle.city, vehicle.state, vehicle.country]
                            .filter(Boolean)
                            .join(", ") || "Location not specified"}
                        </span>
                      </div>
                      
                      <div className="detail-item price">
                        <i className="fa fa-tag"></i>
                        <span className="price-value">{vehicle.price || "Price not specified"}</span>
                      </div>
                      
                      <div className="detail-item status">
                        <i className="fa fa-info-circle"></i>
                        <span className={vehicle.booked ? "booked-status" : "available-status"}>
                          {vehicle.booked ? "Booked" : "Available"}
                        </span>
                      </div>
                      
                      {vehicle.withDriver && (
                        <div className="detail-item driver">
                          <i className="fa fa-user-shield"></i>
                          <span>With Driver</span>
                        </div>
                      )}
                    </div>
                    
                    <button className="view-details-btn">
                      View Details <i className="fa fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="page-btn prev"
              >
                <i className="fa fa-chevron-left"></i> Prev
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={currentPage === pageNum ? "page-btn active" : "page-btn"}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="ellipsis">...</span>
                    <button
                      className="page-btn"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="page-btn next"
              >
                Next <i className="fa fa-chevron-right"></i>
              </button>
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