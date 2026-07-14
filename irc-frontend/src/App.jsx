import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./Layouts/AppLayout";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignupPage";
import DashboardPage from "./Pages/DashboardPage";
import WorkspacePage from "./Pages/WorkSpacePage";
import TasksPage from "./Pages/TasksPage";
import DocumentsPage from "./Pages/DocumentsPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout title="Workspaces" subtitle="Your active research groups" />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout title="Documents" subtitle="Everything you've uploaded" />
            </ProtectedRoute>
          }
        >
          <Route path="/documents" element={<DocumentsPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout title="Tasks" subtitle="What's on your plate" />
            </ProtectedRoute>
          }
        >
          <Route path="/tasks" element={<TasksPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout title="Workspace" subtitle="Ask questions grounded in your docs" />
            </ProtectedRoute>
          }
        >
          <Route path="/workspaces/:id" element={<WorkspacePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}