import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Check, X } from "lucide-react";
import apiClient from "../api/client";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const response = await apiClient.get("/workspaces");
      setWorkspaces(response.data);
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    }
  };

  const fetchPendingInvites = async () => {
  try {
    const response = await apiClient.get("/workspaces/pending");
    setPendingInvites(response.data);
  } catch (err) {
    console.error("Failed to fetch pending invites:", err);
  }
};

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchWorkspaces(), fetchPendingInvites()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await apiClient.post("/workspaces", { name: newName });
      setNewName("");
      setShowForm(false);
      fetchAll();
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  };

  const handleAccept = async (membershipId) => {
    try {
      await apiClient.post(`/workspaces/invites/${membershipId}/accept`);
      fetchAll();
    } catch (err) {
      console.error("Failed to accept invite:", err);
    }
  };

  const handleDecline = async (membershipId) => {
    try {
      await apiClient.post(`/workspaces/invites/${membershipId}/decline`);
      fetchAll();
    } catch (err) {
      console.error("Failed to decline invite:", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-text-muted">Loading workspaces...</div>;
  }

  return (
    <div className="p-8">
      {pendingInvites.length > 0 && (
        <div className="mb-8">
          <p className="text-sm text-text-muted mb-3">
            Pending invites ({pendingInvites.length})
          </p>
          <div className="flex flex-col gap-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.membershipId}
                className="flex items-center justify-between rounded-md bg-signal/10 border border-signal/30 px-4 py-3"
              >
                <span className="text-sm text-paper-soft">
                  You've been invited to{" "}
                  <span className="font-medium">{invite.workspaceName}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(invite.membershipId)}
                    className="flex items-center gap-1 rounded-md bg-amber text-ink text-xs font-medium px-3 py-1.5 hover:bg-amber-dim transition-colors"
                  >
                    <Check size={13} />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(invite.membershipId)}
                    className="flex items-center gap-1 rounded-md bg-ink-soft text-text-muted text-xs font-medium px-3 py-1.5 hover:text-paper-soft transition-colors"
                  >
                    <X size={13} />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-muted">
          {workspaces.length} active workspaces
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-md bg-amber text-ink text-sm font-medium px-4 py-2 hover:bg-amber-dim transition-colors"
        >
          <Plus size={16} />
          New workspace
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex gap-2 mb-6 bg-ink-soft/50 border border-white/5 rounded-lg p-4"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Workspace name"
            className="flex-1 rounded-md bg-paper text-text-primary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted"
          />
          <button
            type="submit"
            className="rounded-md bg-amber text-ink text-sm font-medium px-4 py-2 hover:bg-amber-dim transition-colors"
          >
            Create
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((ws) => (
          <Link
            key={ws._id}
            to={`/workspaces/${ws._id}`}
            className="rounded-lg bg-ink-soft/50 border border-white/5 p-5 hover:border-amber/40 transition-colors"
          >
            <h3 className="font-display text-lg text-paper-soft mb-3">
              {ws.name}
            </h3>
            <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
              <span className="flex items-center gap-1.5">
                <Users size={13} /> {ws.role}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}