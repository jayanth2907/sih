export const APP_NAME = "TRINETRA";
export const APP_SUBTITLE = "GOV & SAFETY";
export const APP_TAGLINE = "AI-Powered Smart Governance & Compliance Monitoring";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const ROLES = {
  ADMIN: "ADMIN",
  CORPORATE: "CORPORATE",
  REGULATOR: "REGULATOR",
  MINE_OFFICER: "MINE_OFFICER",
  INSPECTOR: "INSPECTOR",
  CONTRACTOR: "CONTRACTOR",
};

export const SEVERITY_LEVELS = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

export const VIOLATION_STATUSES = {
  OPEN: "OPEN",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  REMEDIATION_PENDING: "REMEDIATION_PENDING",
  ESCALATED: "ESCALATED",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
};

export const SUBSIDIARIES = [
  "All India",
  "BCCL (Bharat Coking Coal)",
  "ECL (Eastern Coalfields)",
  "CCL (Central Coalfields)",
  "SECL (South Eastern Coalfields)",
  "MCL (Mahanadi Coalfields)",
  "NCL (Northern Coalfields)",
  "WCL (Western Coalfields)",
];

export const DEMO_USERS = [
  {
    name: "Jayanth Varma",
    email: "corporate.hq@coalindia.in",
    role: "CORPORATE",
    designation: "Executive Director (Safety)",
    subsidiary: "Coal India HQ",
    avatar: "JV"
  },
  {
    name: "Rajesh Sharma",
    email: "officer.jharia@bccl.co.in",
    role: "MINE_OFFICER",
    designation: "Senior Mine Safety Officer",
    subsidiary: "BCCL - Jharia Pit #4",
    avatar: "RS"
  },
  {
    name: "Dr. Ananya Sen",
    email: "regulator.dgms@gov.in",
    role: "REGULATOR",
    designation: "DGMS Director of Mine Safety",
    subsidiary: "DGMS Central Zone",
    avatar: "AS"
  },
  {
    name: "Vikram Rathore",
    email: "inspector.dhanbad@gov.in",
    role: "INSPECTOR",
    designation: "Field Safety Inspector",
    subsidiary: "DGMS Dhanbad",
    avatar: "VR"
  },
  {
    name: "System Admin",
    email: "admin@coalgov.gov.in",
    role: "ADMIN",
    designation: "Principal Platform Administrator",
    subsidiary: "Ministry of Coal",
    avatar: "SA"
  }
];
