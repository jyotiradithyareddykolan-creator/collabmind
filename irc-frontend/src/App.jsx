import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import WorkspacePage from "./pages/WorkspacePage";
import TasksPage from "./pages/TasksPage";
import DocumentsPage from "./pages/DocumentsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<AppLayout title="Workspaces" subtitle="Your active research groups" />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>

        <Route element={<AppLayout title="Documents" subtitle="Everything you've uploaded" />}>
          <Route path="/documents" element={<DocumentsPage />} />
        </Route>

        <Route element={<AppLayout title="Tasks" subtitle="What's on your plate" />}>
          <Route path="/tasks" element={<TasksPage />} />
        </Route>

        <Route element={<AppLayout title="Workspace" subtitle="Ask questions grounded in your docs" />}>
          <Route path="/workspaces/:id" element={<WorkspacePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}