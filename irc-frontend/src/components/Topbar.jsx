import { Search, Bell, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title, subtitle, onMenuClick }) {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-ink px-4 sm:px-8 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden text-text-muted hover:text-paper-soft flex-shrink-0"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl text-paper-soft truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-text-muted mt-0.5 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <div className="hidden md:flex items-center gap-2 rounded-md bg-ink-soft px-3 py-1.5 text-sm text-text-muted w-64">
          <Search size={15} />
          <input
            placeholder="Search documents, tasks..."
            className="bg-transparent outline-none w-full placeholder:text-text-muted text-paper-soft"
          />
        </div>
        <button className="md:hidden text-text-muted hover:text-paper-soft">
          <Search size={18} />
        </button>
        <button className="text-text-muted hover:text-paper-soft transition-colors">
          <Bell size={18} />
        </button>
        <div className="h-8 w-8 rounded-full bg-signal flex items-center justify-center text-xs font-medium text-paper-soft flex-shrink-0">
          {initials}
        </div>
      </div>
    </header>
  );
}