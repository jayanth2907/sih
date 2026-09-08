export const formatRiskScore = (score) => {
  if (score === null || score === undefined) return "N/A";
  return Number(score).toFixed(1);
};

export const getRiskCategory = (score) => {
  if (score >= 80) return { label: "CRITICAL", color: "text-status-critical", bg: "bg-status-critical/15", border: "border-status-critical/30" };
  if (score >= 60) return { label: "HIGH", color: "text-amber-500", bg: "bg-amber-500/15", border: "border-amber-500/30" };
  if (score >= 40) return { label: "MEDIUM", color: "text-yellow-400", bg: "bg-yellow-400/15", border: "border-yellow-400/30" };
  return { label: "LOW", color: "text-status-success", bg: "bg-status-success/15", border: "border-status-success/30" };
};

export const getSeverityBadge = (severity) => {
  const sev = (severity || "").toUpperCase();
  switch (sev) {
    case "CRITICAL":
      return { label: "CRITICAL", color: "text-status-critical", bg: "bg-status-critical/15", border: "border-status-critical/40" };
    case "HIGH":
      return { label: "HIGH", color: "text-amber-500", bg: "bg-amber-500/15", border: "border-amber-500/40" };
    case "MEDIUM":
      return { label: "MEDIUM", color: "text-yellow-400", bg: "bg-yellow-400/15", border: "border-yellow-400/40" };
    case "LOW":
    default:
      return { label: "LOW", color: "text-status-success", bg: "bg-status-success/15", border: "border-status-success/40" };
  }
};

export const getStatusBadge = (status) => {
  const st = (status || "").toUpperCase();
  switch (st) {
    case "ESCALATED":
      return { label: "Escalated", color: "text-status-critical", bg: "bg-status-critical/20", border: "border-status-critical/40" };
    case "IN_PROGRESS":
      return { label: "In Progress", color: "text-amber-400", bg: "bg-amber-400/20", border: "border-amber-400/40" };
    case "RESOLVED":
      return { label: "Resolved", color: "text-teal-400", bg: "bg-teal-400/20", border: "border-teal-400/40" };
    case "CLOSED":
      return { label: "Closed", color: "text-status-success", bg: "bg-status-success/20", border: "border-status-success/40" };
    case "ASSIGNED":
      return { label: "Assigned", color: "text-sky-400", bg: "bg-sky-400/20", border: "border-sky-400/40" };
    case "OPEN":
    default:
      return { label: "Open", color: "text-slate-300", bg: "bg-slate-700/40", border: "border-slate-600/40" };
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffHours = Math.round((d - now) / (1000 * 60 * 60));
  
  if (diffHours < 0) {
    return { text: "Breached", isOverdue: true };
  }
  if (diffHours < 24) {
    return { text: `Due in ${diffHours}h`, isOverdue: false };
  }
  const diffDays = Math.ceil(diffHours / 24);
  return { text: `Due in ${diffDays}d`, isOverdue: false };
};
