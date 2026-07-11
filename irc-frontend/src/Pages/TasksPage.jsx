import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import apiClient from "../api/client";

const statusStyles = {
  todo: "bg-ink-soft text-text-muted",
  in_progress: "bg-signal/20 text-signal",
  done: "bg-amber/20 text-amber",
};

const nextStatus = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");

  const fetchAll = async () => {
    try {
      const workspacesResponse = await apiClient.get("/workspaces");
      const ws = workspacesResponse.data;
      setWorkspaces(ws);
      if (ws.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(ws[0]._id);
      }

      const tasksPerWorkspace = await Promise.all(
        ws.map(async (workspace) => {
          const res = await apiClient.get(`/tasks/${workspace._id}`);
          return res.data.map((task) => ({
            ...task,
            workspaceName: workspace.name,
          }));
        })
      );

      setTasks(tasksPerWorkspace.flat());
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedWorkspace) return;
    try {
      await apiClient.post(`/tasks/${selectedWorkspace}`, { title: newTitle });
      setNewTitle("");
      fetchAll();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleStatusToggle = async (task) => {
    try {
      await apiClient.patch(`/tasks/${task._id}`, {
        status: nextStatus[task.status],
      });
      fetchAll();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      fetchAll();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-text-muted">Loading tasks...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="rounded-md bg-ink-soft text-paper-soft px-3 py-2 text-sm outline-none border border-white/5"
        >
          {workspaces.map((ws) => (
            <option key={ws._id} value={ws._id}>
              {ws.name}
            </option>
          ))}
        </select>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task title..."
          className="flex-1 rounded-md bg-ink-soft text-paper-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md bg-amber text-ink text-sm font-medium px-4 py-2 hover:bg-amber-dim transition-colors"
        >
          <Plus size={15} />
          Add
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {tasks.length === 0 && (
          <p className="text-sm text-text-muted italic">No tasks yet.</p>
        )}
        {tasks.map((task) => (
          <div
            key={task._id}
            className="flex items-center justify-between rounded-md bg-ink-soft/40 border border-white/5 px-4 py-3"
          >
            <div>
              <span className="text-sm text-paper-soft">{task.title}</span>
              <p className="text-xs text-text-muted font-mono">
                {task.workspaceName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStatusToggle(task)}
                className={`text-xs font-mono px-2 py-1 rounded cursor-pointer ${statusStyles[task.status]}`}
              >
                {task.status.replace("_", " ")}
              </button>
              <button
                onClick={() => handleDelete(task._id)}
                className="text-text-muted hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}