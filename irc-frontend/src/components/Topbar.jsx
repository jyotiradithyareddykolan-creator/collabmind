import { Search, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title, subtitle }) {
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
    <header className="flex items-center justify-between border-b border-white/5 bg-ink px-8 py-4">
      <div>
        <h1 className="font-display text-xl text-paper-soft">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-md bg-ink-soft px-3 py-1.5 text-sm text-text-muted w-64">
          <Search size={15} />
          <input
            placeholder="Search documents, tasks..."
            className="bg-transparent outline-none w-full placeholder:text-text-muted text-paper-soft"
          />
        </div>
        <button className="text-text-muted hover:text-paper-soft transition-colors">
          <Bell size={18} />
        </button>
        <div className="h-8 w-8 rounded-full bg-signal flex items-center justify-center text-xs font-medium text-paper-soft">
          {initials}
        </div>
      </div>
    </header>
  );
}