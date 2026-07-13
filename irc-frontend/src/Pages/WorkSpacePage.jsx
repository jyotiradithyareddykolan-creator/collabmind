import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Upload,
  Send,
  FileText,
  Users,
  UserPlus,
  MessageSquare,
  StickyNote,
  Download,
  Settings,
  Lock,
  Swords,
  ArrowLeft,
  ThumbsUp,
  Sparkles,
  Plus,
} from "lucide-react";
import MarginRail from "../components/MarginRail";
import apiClient from "../api/client";
import MarkdownText from "../components/MarkdownText";

export default function WorkspacePage() {
  const { id } = useParams();
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sources, setSources] = useState([]);
  const [asking, setAsking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "notes" | "debates"

  // Notes state
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSavedAt, setNoteSavedAt] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [canEditNote, setCanEditNote] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editPermission, setEditPermission] = useState("all");
  const [allowedEditors, setAllowedEditors] = useState([]);
  const [showPermissionPanel, setShowPermissionPanel] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Debates state
  const [debates, setDebates] = useState([]);
  const [debatesLoading, setDebatesLoading] = useState(false);
  const [selectedDebateId, setSelectedDebateId] = useState(null);
  const [debateDetail, setDebateDetail] = useState(null); // { debate, comments }
  const [debateDetailLoading, setDebateDetailLoading] = useState(false);
  const [showNewDebateForm, setShowNewDebateForm] = useState(false);
  const [newDebateTitle, setNewDebateTitle] = useState("");
  const [newDebateDescription, setNewDebateDescription] = useState("");
  const [creatingDebate, setCreatingDebate] = useState(false);
  const [newCommentStance, setNewCommentStance] = useState("for");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [useRag, setUseRag] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [aiParticipantLoading, setAiParticipantLoading] = useState(null); // "for" | "against" | null
  const [aiCounterLoadingId, setAiCounterLoadingId] = useState(null); // commentId | null

  const fetchDocuments = async () => {
    try {
      const response = await apiClient.get(`/documents/${id}`);
      setDocuments(response.data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await apiClient.get(`/workspaces/${id}/members`);
      setMembers(response.data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  const fetchNote = async () => {
    setNoteLoading(true);
    try {
      const response = await apiClient.get(`/notes/${id}`);
      setNoteContent(response.data.content || "");
      setCanEditNote(response.data.canEdit ?? true);
      setIsOwner(response.data.isOwner ?? false);
      setEditPermission(response.data.editPermission || "all");
      setAllowedEditors(
        (response.data.allowedEditors || []).map((e) =>
          typeof e === "string" ? e : e._id || e
        )
      );
    } catch (err) {
      console.error("Failed to fetch note:", err);
    } finally {
      setNoteLoading(false);
    }
  };

  const fetchDebates = async () => {
    setDebatesLoading(true);
    try {
      const response = await apiClient.get(`/debates/${id}`);
      setDebates(response.data);
    } catch (err) {
      console.error("Failed to fetch debates:", err);
    } finally {
      setDebatesLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchMembers();
    fetchNote();
    fetchDebates();
  }, [id]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      await apiClient.post(`/documents/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchDocuments();
    } catch (err) {
      console.error("Upload failed:", err);
      alert(
        "Upload failed: " +
          (err.response?.data?.error || err.response?.data?.message || "unknown error")
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const question = input;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setAsking(true);

    try {
      const response = await apiClient.post(`/workspaces/${id}/ask`, {
        question,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: response.data.answer },
      ]);
      setSources(response.data.sources);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong answering that." },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    if (!inviteEmail.trim()) return;

    try {
      await apiClient.post(`/workspaces/${id}/invite`, { email: inviteEmail });
      setInviteSuccess(`${inviteEmail} added to workspace.`);
      setInviteEmail("");
      fetchMembers();
    } catch (err) {
      setInviteError(err.response?.data?.message || "Failed to invite");
    }
  };

  const handleSaveNote = async () => {
    setNoteSaving(true);
    try {
      const response = await apiClient.put(`/notes/${id}`, {
        content: noteContent,
      });
      setNoteContent(response.data.content);
      setNoteSavedAt(new Date());
    } catch (err) {
      console.error("Failed to save note:", err);
      if (err.response?.status === 403) {
        alert("You don't have permission to edit these notes right now.");
        fetchNote();
      } else {
        alert("Failed to save note: " + (err.response?.data?.message || "unknown error"));
      }
    } finally {
      setNoteSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      const response = await apiClient.put(`/notes/${id}/permissions`, {
        editPermission,
        allowedEditors: editPermission === "selected" ? allowedEditors : [],
      });
      setEditPermission(response.data.editPermission);
      setAllowedEditors(response.data.allowedEditors || []);
      setShowPermissionPanel(false);
      fetchNote();
    } catch (err) {
      console.error("Failed to save permissions:", err);
      alert(
        "Failed to update permissions: " +
          (err.response?.data?.message || "unknown error")
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  const toggleAllowedEditor = (memberId) => {
    setAllowedEditors((prev) =>
      prev.includes(memberId)
        ? prev.filter((m) => m !== memberId)
        : [...prev, memberId]
    );
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const response = await apiClient.get(`/notes/${id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `workspace-notes-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to export PDF: " + (err.response?.data?.message || "unknown error"));
    } finally {
      setExportingPdf(false);
    }
  };

  // ---------- Debates handlers ----------

  const fetchDebateDetail = async (debateId) => {
    setDebateDetailLoading(true);
    setAiSummary("");
    try {
      const response = await apiClient.get(`/debates/${id}/${debateId}`);
      setDebateDetail(response.data);
    } catch (err) {
      console.error("Failed to fetch debate:", err);
      alert("Failed to load debate: " + (err.response?.data?.message || "unknown error"));
    } finally {
      setDebateDetailLoading(false);
    }
  };

  const handleOpenDebate = (debateId) => {
    setSelectedDebateId(debateId);
    fetchDebateDetail(debateId);
  };

  const handleBackToList = () => {
    setSelectedDebateId(null);
    setDebateDetail(null);
    setAiSummary("");
    fetchDebates();
  };

  const handleCreateDebate = async (e) => {
    e.preventDefault();
    if (!newDebateTitle.trim()) return;

    setCreatingDebate(true);
    try {
      await apiClient.post(`/debates/${id}`, {
        title: newDebateTitle.trim(),
        description: newDebateDescription.trim(),
      });
      setNewDebateTitle("");
      setNewDebateDescription("");
      setShowNewDebateForm(false);
      fetchDebates();
    } catch (err) {
      alert("Failed to create debate: " + (err.response?.data?.message || "unknown error"));
    } finally {
      setCreatingDebate(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !selectedDebateId) return;

    setPostingComment(true);
    try {
      await apiClient.post(`/debates/${id}/${selectedDebateId}/comments`, {
        stance: newCommentStance,
        content: newCommentContent.trim(),
      });
      setNewCommentContent("");
      fetchDebateDetail(selectedDebateId);
    } catch (err) {
      alert("Failed to post comment: " + (err.response?.data?.message || "unknown error"));
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpvote = async (commentId) => {
    try {
      await apiClient.post(
        `/debates/${id}/${selectedDebateId}/comments/${commentId}/upvote`
      );
      fetchDebateDetail(selectedDebateId);
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    setAiSummary("");
    try {
      const response = await apiClient.post(
        `/debates/${id}/${selectedDebateId}/ai/summarize`,
        { useRag }
      );
      setAiSummary(response.data.summary);
    } catch (err) {
      alert(
        "AI summarize failed: " +
          (err.response?.data?.error || err.response?.data?.message || "unknown error")
      );
    } finally {
      setSummarizing(false);
    }
  };

  const handleAiParticipant = async (stance) => {
    setAiParticipantLoading(stance);
    try {
      await apiClient.post(`/debates/${id}/${selectedDebateId}/ai/participant`, {
        stance,
        useRag,
      });
      fetchDebateDetail(selectedDebateId);
    } catch (err) {
      alert(
        "AI participant failed: " +
          (err.response?.data?.error || err.response?.data?.message || "unknown error")
      );
    } finally {
      setAiParticipantLoading(null);
    }
  };

  const handleAiCounter = async (commentId) => {
    setAiCounterLoadingId(commentId);
    try {
      await apiClient.post(`/debates/${id}/${selectedDebateId}/ai/counter`, {
        commentId,
        useRag,
      });
      fetchDebateDetail(selectedDebateId);
    } catch (err) {
      alert(
        "AI counter failed: " +
          (err.response?.data?.error || err.response?.data?.message || "unknown error")
      );
    } finally {
      setAiCounterLoadingId(null);
    }
  };

  const stanceColor = (stance) =>
    stance === "for"
      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5"
      : stance === "against"
      ? "text-red-400 border-red-400/30 bg-red-400/5"
      : "text-text-muted border-white/10 bg-white/5";

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-white/5 p-4 overflow-y-auto flex flex-col gap-4">
        <div>
          <label className="flex items-center gap-2 w-full justify-center rounded-md border border-dashed border-white/10 text-text-muted text-sm py-2.5 mb-4 hover:border-amber/50 hover:text-paper-soft transition-colors cursor-pointer">
            <Upload size={14} />
            {uploading ? "Uploading..." : "Upload document"}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <div className="flex flex-col gap-1">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-paper-soft px-2 py-1.5 rounded-md hover:bg-ink-soft/50 cursor-pointer"
              >
                <FileText size={14} />
                <span className="truncate">{doc.originalName}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-4">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-paper-soft mb-2"
          >
            <Users size={14} />
            {members.length} member{members.length !== 1 ? "s" : ""}
          </button>

          {showMembers && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                {members.map((m) => (
                  <div key={m.id} className="text-xs text-text-muted">
                    <span className="text-paper-soft">{m.name}</span>{" "}
                    <span className="font-mono">({m.role})</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleInvite} className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@email.com"
                    className="flex-1 min-w-0 rounded-md bg-ink-soft text-paper-soft px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-amber text-ink p-1.5 hover:bg-amber-dim transition-colors"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>
                {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
                {inviteSuccess && <p className="text-xs text-amber">{inviteSuccess}</p>}
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 border-b border-white/5 px-4 pt-3">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-t-md transition-colors ${
              activeTab === "chat"
                ? "text-paper-soft bg-ink-soft border-b-2 border-amber"
                : "text-text-muted hover:text-paper-soft"
            }`}
          >
            <MessageSquare size={14} />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-t-md transition-colors ${
              activeTab === "notes"
                ? "text-paper-soft bg-ink-soft border-b-2 border-amber"
                : "text-text-muted hover:text-paper-soft"
            }`}
          >
            <StickyNote size={14} />
            Notes
          </button>
          <button
            onClick={() => setActiveTab("debates")}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-t-md transition-colors ${
              activeTab === "debates"
                ? "text-paper-soft bg-ink-soft border-b-2 border-amber"
                : "text-text-muted hover:text-paper-soft"
            }`}
          >
            <Swords size={14} />
            Debates
          </button>
        </div>

        {activeTab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {messages.length === 0 && (
                <p className="text-sm text-text-muted italic">
                  Ask a question about this workspace's documents.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-lg rounded-lg px-4 py-2.5 ${
                    m.role === "user"
                      ? "self-end bg-signal text-paper-soft text-sm"
                      : "self-start bg-ink-soft text-paper-soft border border-white/5"
                  }`}
                >
                  {m.role === "assistant" ? <MarkdownText>{m.text}</MarkdownText> : m.text}
                </div>
              ))}
              {asking && (
                <div className="self-start text-sm text-text-muted italic">Thinking...</div>
              )}
            </div>

            <div className="border-t border-white/5 p-4 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask something about this workspace's documents..."
                className="flex-1 rounded-md bg-ink-soft text-paper-soft px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted"
              />
              <button
                onClick={handleSend}
                className="rounded-md bg-amber text-ink p-2.5 hover:bg-amber-dim transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}

        {activeTab === "notes" && (
          <div className="flex-1 flex flex-col p-6 gap-3 overflow-y-auto">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-text-muted">
                Shared notes for this workspace.{" "}
                {editPermission === "all" && "Anyone can edit."}
                {editPermission === "owner_only" && "Only the owner can edit."}
                {editPermission === "selected" && "Only selected members can edit."}
              </p>
              <div className="flex items-center gap-2">
                {noteSavedAt && !noteSaving && (
                  <span className="text-xs text-text-muted">
                    Saved {noteSavedAt.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="flex items-center gap-1.5 rounded-md border border-white/10 text-text-muted px-3 py-1.5 text-sm hover:text-paper-soft hover:border-white/20 transition-colors disabled:opacity-50"
                >
                  <Download size={14} />
                  {exportingPdf ? "Exporting..." : "Export PDF"}
                </button>
                {isOwner && (
                  <button
                    onClick={() => setShowPermissionPanel(!showPermissionPanel)}
                    className="flex items-center gap-1.5 rounded-md border border-white/10 text-text-muted px-3 py-1.5 text-sm hover:text-paper-soft hover:border-white/20 transition-colors"
                  >
                    <Settings size={14} />
                    Permissions
                  </button>
                )}
                <button
                  onClick={handleSaveNote}
                  disabled={noteSaving || noteLoading || !canEditNote}
                  className="rounded-md bg-amber text-ink px-3 py-1.5 text-sm hover:bg-amber-dim transition-colors disabled:opacity-50"
                >
                  {noteSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {isOwner && showPermissionPanel && (
              <div className="rounded-md border border-white/10 bg-ink-soft p-4 flex flex-col gap-3">
                <p className="text-sm text-paper-soft font-medium">Who can edit these notes?</p>
                <div className="flex flex-col gap-2">
                  {[
                    { value: "all", label: "All members" },
                    { value: "selected", label: "Selected members" },
                    { value: "owner_only", label: "Only me" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-sm text-text-muted cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="editPermission"
                        checked={editPermission === opt.value}
                        onChange={() => setEditPermission(opt.value)}
                        className="accent-amber"
                      />
                      <span className={editPermission === opt.value ? "text-paper-soft" : ""}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>

                {editPermission === "selected" && (
                  <div className="flex flex-col gap-1.5 pl-6 border-l border-white/5">
                    {members.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 text-xs text-text-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={allowedEditors.includes(m.id)}
                          onChange={() => toggleAllowedEditor(m.id)}
                          className="accent-amber"
                        />
                        <span>
                          {m.name} <span className="font-mono">({m.role})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSavePermissions}
                    disabled={savingPermissions}
                    className="rounded-md bg-amber text-ink px-3 py-1.5 text-sm hover:bg-amber-dim transition-colors disabled:opacity-50"
                  >
                    {savingPermissions ? "Saving..." : "Save permissions"}
                  </button>
                  <button
                    onClick={() => setShowPermissionPanel(false)}
                    className="rounded-md border border-white/10 text-text-muted px-3 py-1.5 text-sm hover:text-paper-soft transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!canEditNote && !noteLoading && (
              <div className="flex items-center gap-2 text-xs text-amber/80 bg-amber/5 border border-amber/20 rounded-md px-3 py-2">
                <Lock size={12} />
                You don't have permission to edit these notes. Contact the workspace owner if you
                need access.
              </div>
            )}

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              disabled={noteLoading || !canEditNote}
              placeholder={
                noteLoading
                  ? "Loading notes..."
                  : "Start writing literature review notes, meeting summaries, or draft sections here..."
              }
              className="flex-1 w-full resize-none rounded-md bg-ink-soft text-paper-soft px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted font-mono leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {activeTab === "debates" && (
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedDebateId ? (
              // ---------- Debate list view ----------
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">
                    Structured debates for this workspace — post positions, get AI-assisted
                    counter-arguments, and vote on the strongest points.
                  </p>
                  <button
                    onClick={() => setShowNewDebateForm(!showNewDebateForm)}
                    className="flex items-center gap-1.5 rounded-md bg-amber text-ink px-3 py-1.5 text-sm hover:bg-amber-dim transition-colors whitespace-nowrap"
                  >
                    <Plus size={14} />
                    New debate
                  </button>
                </div>

                {showNewDebateForm && (
                  <form
                    onSubmit={handleCreateDebate}
                    className="rounded-md border border-white/10 bg-ink-soft p-4 flex flex-col gap-3"
                  >
                    <input
                      value={newDebateTitle}
                      onChange={(e) => setNewDebateTitle(e.target.value)}
                      placeholder="Debate title — a clear, debatable claim"
                      className="rounded-md bg-ink text-paper-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted"
                    />
                    <textarea
                      value={newDebateDescription}
                      onChange={(e) => setNewDebateDescription(e.target.value)}
                      placeholder="Optional context or framing"
                      rows={2}
                      className="rounded-md bg-ink text-paper-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={creatingDebate || !newDebateTitle.trim()}
                        className="rounded-md bg-amber text-ink px-3 py-1.5 text-sm hover:bg-amber-dim transition-colors disabled:opacity-50"
                      >
                        {creatingDebate ? "Creating..." : "Create debate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewDebateForm(false)}
                        className="rounded-md border border-white/10 text-text-muted px-3 py-1.5 text-sm hover:text-paper-soft transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {debatesLoading && (
                  <p className="text-sm text-text-muted italic">Loading debates...</p>
                )}

                {!debatesLoading && debates.length === 0 && (
                  <p className="text-sm text-text-muted italic">
                    No debates yet. Start one above.
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {debates.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => handleOpenDebate(d._id)}
                      className="text-left rounded-md border border-white/5 bg-ink-soft/50 p-4 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-paper-soft font-medium">{d.title}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            d.status === "open"
                              ? "text-emerald-400 border-emerald-400/30"
                              : "text-text-muted border-white/10"
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      {d.description && (
                        <p className="text-xs text-text-muted mt-1">{d.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // ---------- Debate detail view ----------
              <div className="flex flex-col gap-4 max-w-3xl">
                <button
                  onClick={handleBackToList}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-paper-soft w-fit"
                >
                  <ArrowLeft size={14} />
                  Back to debates
                </button>

                {debateDetailLoading && (
                  <p className="text-sm text-text-muted italic">Loading debate...</p>
                )}

                {debateDetail && !debateDetailLoading && (
                  <>
                    <div>
                      <h2 className="text-lg text-paper-soft font-medium">
                        {debateDetail.debate.title}
                      </h2>
                      {debateDetail.debate.description && (
                        <p className="text-sm text-text-muted mt-1">
                          {debateDetail.debate.description}
                        </p>
                      )}
                    </div>

                    {/* AI toolbar */}
                    <div className="rounded-md border border-white/10 bg-ink-soft p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <Sparkles size={13} className="text-amber" />
                          AI assistance
                          <label className="flex items-center gap-1.5 ml-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useRag}
                              onChange={(e) => setUseRag(e.target.checked)}
                              className="accent-amber"
                            />
                            Ground in documents (RAG)
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handleSummarize}
                            disabled={summarizing}
                            className="text-xs rounded-md border border-white/10 text-text-muted px-2.5 py-1.5 hover:text-paper-soft hover:border-white/20 transition-colors disabled:opacity-50"
                          >
                            {summarizing ? "Summarizing..." : "Summarize debate"}
                          </button>
                          <button
                            onClick={() => handleAiParticipant("for")}
                            disabled={aiParticipantLoading !== null}
                            className="text-xs rounded-md border border-emerald-400/30 text-emerald-400 px-2.5 py-1.5 hover:bg-emerald-400/10 transition-colors disabled:opacity-50"
                          >
                            {aiParticipantLoading === "for" ? "Thinking..." : "AI argues For"}
                          </button>
                          <button
                            onClick={() => handleAiParticipant("against")}
                            disabled={aiParticipantLoading !== null}
                            className="text-xs rounded-md border border-red-400/30 text-red-400 px-2.5 py-1.5 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          >
                            {aiParticipantLoading === "against" ? "Thinking..." : "AI argues Against"}
                          </button>
                        </div>
                      </div>

                      {aiSummary && (
                        <div className="bg-ink rounded-md p-3">
                          <MarkdownText className="text-paper-soft">{aiSummary}</MarkdownText>
                        </div>
                      )}
                    </div>

                    {/* Comment form */}
                    <form
                      onSubmit={handlePostComment}
                      className="rounded-md border border-white/10 bg-ink-soft p-3 flex flex-col gap-2"
                    >
                      <div className="flex gap-2">
                        {["for", "against", "neutral"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setNewCommentStance(s)}
                            className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${
                              newCommentStance === s
                                ? stanceColor(s)
                                : "text-text-muted border-white/10"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={newCommentContent}
                        onChange={(e) => setNewCommentContent(e.target.value)}
                        placeholder="Add your point to the debate..."
                        rows={2}
                        className="rounded-md bg-ink text-paper-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted resize-none"
                      />
                      <button
                        type="submit"
                        disabled={postingComment || !newCommentContent.trim()}
                        className="self-end rounded-md bg-amber text-ink px-3 py-1.5 text-sm hover:bg-amber-dim transition-colors disabled:opacity-50"
                      >
                        {postingComment ? "Posting..." : "Post"}
                      </button>
                    </form>

                    {/* Comments */}
                    <div className="flex flex-col gap-3">
                      {debateDetail.comments.length === 0 && (
                        <p className="text-sm text-text-muted italic">
                          No comments yet — be the first to weigh in.
                        </p>
                      )}
                      {debateDetail.comments.map((c) => (
                        <div
                          key={c._id}
                          className={`rounded-md border p-3 ${stanceColor(c.stance)}`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-medium capitalize">{c.stance}</span>
                              {c.isAI ? (
                                <span className="flex items-center gap-1 text-amber">
                                  <Sparkles size={11} />
                                  AI · {c.aiType}
                                  {c.groundedInDocs && " · grounded"}
                                </span>
                              ) : (
                                <span className="text-text-muted">{c.author?.name || "Unknown"}</span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted">
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <MarkdownText className="text-paper-soft">{c.content}</MarkdownText>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => handleUpvote(c._id)}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                c.upvotedByMe
                                  ? "text-amber"
                                  : "text-text-muted hover:text-paper-soft"
                              }`}
                            >
                              <ThumbsUp size={12} />
                              {c.upvoteCount}
                            </button>
                            <button
                              onClick={() => handleAiCounter(c._id)}
                              disabled={aiCounterLoadingId === c._id}
                              className="flex items-center gap-1 text-xs text-text-muted hover:text-paper-soft transition-colors disabled:opacity-50"
                            >
                              <Sparkles size={12} />
                              {aiCounterLoadingId === c._id ? "Countering..." : "AI counter"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <MarginRail sources={sources} />
    </div>
  );
}