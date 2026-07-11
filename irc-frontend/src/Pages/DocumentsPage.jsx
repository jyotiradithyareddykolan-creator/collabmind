import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import apiClient from "../api/client";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllDocuments = async () => {
      try {
        const workspacesResponse = await apiClient.get("/workspaces");
        const workspaces = workspacesResponse.data;

        const documentsPerWorkspace = await Promise.all(
          workspaces.map(async (ws) => {
            const docsResponse = await apiClient.get(`/documents/${ws._id}`);
            return docsResponse.data.map((doc) => ({
              ...doc,
              workspaceName: ws.name,
            }));
          })
        );

        setDocuments(documentsPerWorkspace.flat());
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDocuments();
  }, []);

  if (loading) {
    return <div className="p-8 text-text-muted">Loading documents...</div>;
  }

  return (
    <div className="p-8 flex flex-col gap-2 max-w-2xl">
      {documents.length === 0 && (
        <p className="text-sm text-text-muted italic">
          No documents uploaded yet.
        </p>
      )}
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="flex items-center gap-3 rounded-md bg-ink-soft/40 border border-white/5 px-4 py-3"
        >
          <FileText size={16} className="text-text-muted" />
          <div>
            <p className="text-sm text-paper-soft">{doc.originalName}</p>
            <p className="text-xs text-text-muted font-mono">
              {doc.workspaceName}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}