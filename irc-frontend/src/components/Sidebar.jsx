import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, FolderOpen, CheckSquare, LogOut, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navItem = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors border-l-2 ${
      isActive
        ? "border-amber bg-ink-soft text-paper-soft"
        : "border-transparent text-text-muted hover:text-paper-soft hover:bg-ink-soft/60"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop — click to close */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      <aside
        className={`
          flex h-screen w-60 flex-col justify-between bg-ink-soft/40 border-r border-white/5 px-3 py-5
          fixed md:static top-0 left-0 z-40
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        <div>
          <div className="mb-8 px-3 flex items-center justify-between">
            <div>
              <span className="font-display text-lg text-paper-soft">CollabMind</span>
              <p className="text-xs text-text-muted mt-0.5">
                {user ? user.name : "Research, together."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-text-muted hover:text-paper-soft"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <NavLink to="/" className={navItem} end onClick={handleNavClick}>
              <LayoutGrid size={16} />
              Workspaces
            </NavLink>
            <NavLink to="/documents" className={navItem} onClick={handleNavClick}>
              <FolderOpen size={16} />
              Documents
            </NavLink>
            <NavLink to="/tasks" className={navItem} onClick={handleNavClick}>
              <CheckSquare size={16} />
              Tasks
            </NavLink>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted hover:text-paper-soft transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>
    </>
  );
}