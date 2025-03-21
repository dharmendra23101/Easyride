import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import BookHere from "./pages/BookHere";
import Auth from "./pages/Auth";
import EditProfile from "./pages/EditProfile";
import Profile from "./pages/Profile";
import AddVehicle from "./pages/AddVehicle";
import ProfileShow from "./pages/ProfileShow";
import EditVehicles from "./pages/EditVehicles";
import RequestStatus from "./pages/RequestStatus";

function App() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <Router>
      <Navbar onOpenProfile={() => setIsProfileOpen(true)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<BookHere />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/profile-show" element={<ProfileShow />} />
        <Route path="/add-vehicle" element={<AddVehicle />} />
        <Route path="/edit-vehicles" element={<EditVehicles />} />
        <Route path="/request-status" element={<RequestStatus />} />
      </Routes>
      <Profile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </Router>
  );
}

export default App;