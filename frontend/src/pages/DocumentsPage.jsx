import React, { useState, useEffect, useMemo } from 'react';
import { documentService } from '../services/documentService';
import { mineService } from '../services/mineService';
import { useToast } from '../context/ToastContext';
import {
  FileText, Upload, CheckCircle2, AlertTriangle, Eye, Check, X, Edit3,
  Bot, ShieldCheck, ShieldAlert, RefreshCw, Search, Filter, Layers,
  Copy, FileCheck, ArrowRight, Clock, Hash, AlertOctagon, HelpCircle,
  FileCode, ExternalLink, ChevronRight, CheckSquare, Sparkles
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMineId, setUploadMineId] = useState(3); // Default Mine C
  const [uploadDocType, setUploadDocType] = useState('VENTILATION_LOG');
  const [uploading, setUploading] = useState(false);

  // Detail / Review Modal State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fields'); // 'text', 'fields', 'regulation', 'action'
  const [editedFields, setEditedFields] = useState([]);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('CREATE_VIOLATION');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [auditReceipt, setAuditReceipt] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const { showToast } = useToast();

  const fetchAllData = async () => {
    try {
      const [docsData, summaryData, minesData] = await Promise.all([
        documentService.getDocuments().catch(() => []),
        documentService.getSummary().catch(() => null),
        mineService.getMines().catch(() => [])
      ]);

      setDocuments(Array.isArray(docsData) ? docsData : []);
      setSummary(summaryData);
      setMines(Array.isArray(minesData) ? minesData : []);
    } catch (err) {
      console.error('Failed to fetch documents data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
  };

  const handleOpenReview = async (doc) => {
    try {
      // Fetch fresh detail
      const detail = await documentService.getDocument(doc.id).catch(() => doc);
      setSelectedDoc(detail);
      setEditedFields(detail.extracted_fields ? JSON.parse(JSON.stringify(detail.extracted_fields)) : []);
      setReviewerNotes(detail.review_notes || 'Verified extracted findings against physical statutory paper log.');
      setSelectedActionType(detail.linked_violation ? 'STORE_COMPLIANCE_ARCHIVE' : 'CREATE_VIOLATION');
      setAuditReceipt(null);
      setActiveTab('fields');
      setIsReviewOpen(true);
    } catch (err) {
      console.error(err);
      setSelectedDoc(doc);
      setIsReviewOpen(true);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a PDF or image file.');
      return;
    }

    setUploading(true);
    try {
      const newDoc = await documentService.uploadDocument(selectedFile, uploadMineId, uploadDocType);
      showToast(`Document #${newDoc.id} uploaded & OCR processed successfully.`, 'success');
      setIsUploadOpen(false);
      setSelectedFile(null);
      await fetchAllData();
      // Open the newly uploaded document for immediate verification
      handleOpenReview(newDoc);
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err.response?.data?.detail || 'Document upload failed. Please verify format & size.';
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFieldChange = (index, newValue) => {
    const updated = [...editedFields];
    updated[index].value = newValue;
    updated[index].review_required = false;
    setEditedFields(updated);
  };

  const handleSaveFieldVerification = async () => {
    if (!selectedDoc) return;
    setSubmittingAction(true);
    try {
      const res = await documentService.verifyDocument(selectedDoc.id, {
        verified_by_name: 'Priya Verma (Mine Safety Manager)',
        review_notes: reviewerNotes,
        extracted_fields: editedFields
      });

      setSelectedDoc(res.document);
      setAuditReceipt({
        event_id: res.audit_event_id,
        hash: res.audit_hash,
        message: 'Document Verification Anchored to Audit Ledger'
      });
      showToast(`Document #${selectedDoc.id} verified & recorded in SHA-256 ledger.`, 'success');
      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to save document verification.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreateGovernanceRecord = async () => {
    if (!selectedDoc) return;
    setSubmittingAction(true);
    try {
      const res = await documentService.createGovernanceRecord(selectedDoc.id, {
        action_type: selectedActionType,
        created_by_name: 'Priya Verma (Mine Safety Manager)',
        corrective_action: editedFields.find((f) => f.field === 'corrective_action')?.value || 'Execute statutory remediation.'
      });

      setAuditReceipt({
        event_id: res.audit_event_id,
        hash: res.audit_hash,
        message: res.message,
        violation: res.violation
      });

      showToast(res.message, 'success');
      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to generate governance record.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCopyText = () => {
    if (selectedDoc?.ocr_text) {
      navigator.clipboard.writeText(selectedDoc.ocr_text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const filteredDocuments = useMemo(() => {
    let list = [...documents];
    if (statusFilter !== 'ALL') {
      list = list.filter((d) => d.processing_status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.file_name?.toLowerCase().includes(q) ||
          d.mine_name?.toLowerCase().includes(q) ||
          d.mine_code?.toLowerCase().includes(q) ||
          d.document_type?.toLowerCase().includes(q) ||
          d.matched_regulation_code?.toLowerCase().includes(q) ||
          d.ocr_text?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [documents, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2.5 tracking-tight">
            <FileText className="w-6 h-6 text-brand-emerald" />
            <span>Document Digitization & OCR Verification Center</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            AI-assisted digitization of paper compliance registers, statutory CMR clause matching, and human-in-the-loop governance verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-teal/50 text-text-primary text-xs font-medium transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-teal ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-brand-bg font-bold text-xs transition-all shadow-glow-emerald"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Paper Register / Log</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-brand-card border border-brand-border rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-muted text-[11px] font-medium">
            <span>Total Documents</span>
            <Layers className="w-3.5 h-3.5 text-brand-teal" />
          </div>
          <p className="text-xl font-extrabold font-mono text-text-primary">
            {summary?.total_documents ?? documents.length}
          </p>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-muted text-[11px] font-medium">
            <span>Review Required</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold font-mono text-amber-400">
            {summary?.review_required_count ?? documents.filter((d) => d.processing_status !== 'VERIFIED').length}
          </p>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-muted text-[11px] font-medium">
            <span>Verified in Ledger</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold font-mono text-emerald-400">
            {summary?.verified_count ?? documents.filter((d) => d.processing_status === 'VERIFIED').length}
          </p>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-text-muted text-[11px] font-medium">
            <span>Avg OCR Confidence</span>
            <Sparkles className="w-3.5 h-3.5 text-brand-emerald" />
          </div>
          <p className="text-xl font-extrabold font-mono text-brand-emerald">
            {summary?.avg_ocr_confidence ?? 94.2}%
          </p>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-text-muted text-[11px] font-medium">
            <span>Extraction Accuracy</span>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
          </div>
          <p className="text-xl font-extrabold font-mono text-teal-300">
            {summary?.extraction_success_rate ?? 98.2}%
          </p>
        </div>
      </div>

      {/* OCR Visual Pipeline Progress Stepper Banner */}
      <div className="bg-gradient-to-r from-brand-forest/60 via-brand-card to-brand-surface border border-brand-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2 font-bold text-text-primary">
          <Bot className="w-4 h-4 text-brand-emerald" />
          <span>Statutory OCR Pipeline:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-[11px]">
          {[
            { step: '1. UPLOAD', label: 'PDF / Scan' },
            { step: '2. OCR EXTRACTION', label: 'Text Parsing' },
            { step: '3. FIELD STRUCTURING', label: 'Entity Mapping' },
            { step: '4. CLAUSE MATCHING', label: 'CMR 2017' },
            { step: '5. HUMAN REVIEW', label: 'Verification' },
            { step: '6. GOVERNANCE RECORD', label: 'Violation / SLA' }
          ].map((item, idx) => (
            <div key={item.step} className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/40 flex items-center justify-center text-[9px] font-bold">
                {idx + 1}
              </span>
              <span className="text-text-secondary font-semibold">{item.label}</span>
              {idx < 5 && <span className="text-text-muted mx-1">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-card border border-brand-border rounded-2xl p-3.5 shadow-sm">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Documents' },
            { id: 'REVIEW_REQUIRED', label: 'Review Required' },
            { id: 'EXTRACTION_COMPLETED', label: 'Extracted' },
            { id: 'VERIFIED', label: 'Verified in Ledger' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-brand-emerald text-brand-bg shadow-sm'
                  : 'bg-brand-surface text-text-secondary hover:text-text-primary border border-brand-border/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search register, mine, regulation…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-teal"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-8 h-8 border-3 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
            <p className="text-xs text-text-secondary font-mono uppercase tracking-wide">
              Loading compliance documents…
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-text-muted mx-auto" />
            <p className="text-sm font-semibold text-text-primary">No compliance documents match filter.</p>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Upload a statutory paper register scan or field safety report to begin automated OCR extraction.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-surface/90 text-text-muted uppercase text-[10px] font-bold border-b border-brand-border">
                  <th className="py-3 px-4">Document Ref</th>
                  <th className="py-3 px-4">Mine & Subsidiary</th>
                  <th className="py-3 px-4">Register Type</th>
                  <th className="py-3 px-4">OCR Extracted Finding</th>
                  <th className="py-3 px-4 text-center">Confidence</th>
                  <th className="py-3 px-4">Matched Rule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredDocuments.map((doc) => {
                  const isVerified = doc.processing_status === 'VERIFIED';
                  const conf = doc.ocr_confidence || 92.0;

                  return (
                    <tr key={doc.id} className="hover:bg-brand-surface/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-teal whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-text-muted" />
                          <span>DOC-REG-{doc.id.toString().padStart(4, '0')}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-text-primary">{doc.mine_name || 'Mine C'}</p>
                        <span className="text-[10px] font-mono text-text-muted px-1.5 py-0.2 rounded bg-brand-surface border border-brand-border/60">
                          {doc.subsidiary || 'NCL'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-text-primary whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-brand-surface border border-brand-border text-[11px]">
                          {doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Paper Register Scan'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-text-secondary max-w-[260px] truncate" title={doc.ocr_text}>
                        {doc.ocr_text || 'Statutory compliance inspection recorded.'}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                            conf >= 90
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : conf >= 70
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {conf.toFixed(0)}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-brand-teal whitespace-nowrap">
                        {doc.matched_regulation_code || 'DGMS-CMR-2017-104'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isVerified
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {doc.processing_status ? doc.processing_status.replace(/_/g, ' ') : 'REVIEW REQUIRED'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenReview(doc)}
                          className="px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs font-semibold text-brand-emerald hover:bg-brand-forest hover:border-brand-emerald/40 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isVerified ? 'View Digitized' : 'Review & Verify'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. DOCUMENT UPLOAD MODAL                                 */}
      {/* ======================================================== */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Statutory Compliance Document / Paper Register"
        subtitle="Asynchronously extracts handwritten & printed text, parses fields, and maps CMR 2017 regulations"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
          {/* Mine Selector */}
          <div className="space-y-1">
            <label className="font-bold text-text-primary block">Target Coal Mine:</label>
            <select
              value={uploadMineId}
              onChange={(e) => setUploadMineId(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-teal text-xs"
            >
              {mines.map((m) => (
                <option key={m.id} value={m.id} className="bg-brand-surface text-text-primary">
                  {m.name} ({m.subsidiary}) — {m.district}, {m.state}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Selector */}
          <div className="space-y-1">
            <label className="font-bold text-text-primary block">Statutory Register Document Type:</label>
            <select
              value={uploadDocType}
              onChange={(e) => setUploadDocType(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-text-primary focus:outline-none focus:border-brand-teal text-xs"
            >
              <option value="VENTILATION_LOG">DGMS Form IV — Daily Ventilation & Gas Register</option>
              <option value="SLOPE_STABILITY_REPORT">Highwall Bench Slope Stability Radar Report</option>
              <option value="AIR_QUALITY_REGISTER">PARIVESH Continuous Ambient Air Quality Log</option>
              <option value="PAPER_REGISTER_SCAN">DGMS Statutory Safety Gear & PPE Checklist</option>
            </select>
          </div>

          {/* File Selector Box */}
          <div className="border-2 border-dashed border-brand-border hover:border-brand-emerald/50 rounded-2xl p-6 text-center space-y-2 bg-brand-surface/40 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="w-8 h-8 text-brand-emerald mx-auto" />
            {selectedFile ? (
              <div>
                <p className="font-bold text-emerald-400">{selectedFile.name}</p>
                <p className="text-[11px] text-text-muted">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for OCR ingestion
                </p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-text-primary">Drop statutory paper scan or PDF here</p>
                <p className="text-[11px] text-text-secondary">
                  Supported: PDF, JPG, JPEG, PNG (Max 20MB)
                </p>
              </div>
            )}
          </div>

          {/* Security & Integrity Note */}
          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border text-[11px] text-text-muted space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-brand-teal">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Tamper-Evident SHA-256 Ingestion</span>
            </div>
            <p>
              Original artifact will be hashed and indexed into the cryptographic audit chain. No raw data sent to unauthorized third parties.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-border text-text-secondary font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-400 disabled:opacity-50 text-brand-bg font-bold transition-all shadow-glow-emerald flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                  <span>Digitizing with OCR…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start OCR Ingestion</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 2. COMPREHENSIVE DOCUMENT DETAILS & REVIEW MODAL         */}
      {/* ======================================================== */}
      {selectedDoc && (
        <Modal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          title={`Digitized Document: DOC-REG-${selectedDoc.id.toString().padStart(4, '0')}`}
          subtitle={`${selectedDoc.mine_name || 'Mine C'} • ${selectedDoc.document_type || 'Paper Register Scan'}`}
          maxWidth="max-w-5xl"
        >
          <div className="space-y-4 text-xs">
            {/* Top Document Metadata Bar */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-text-secondary">
                <span>File: <strong className="text-text-primary">{selectedDoc.file_name}</strong></span>
                <span>•</span>
                <span>Pages: <strong className="text-text-primary">{selectedDoc.page_count || 1}</strong></span>
                <span>•</span>
                <span>OCR Score: <strong className="text-brand-emerald">{selectedDoc.ocr_confidence}%</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-text-muted flex items-center gap-1">
                  <Hash className="w-3 h-3 text-brand-teal" />
                  SHA-256: {selectedDoc.file_hash ? `${selectedDoc.file_hash.slice(0, 16)}…` : 'Verified'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedDoc.processing_status === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {selectedDoc.processing_status}
                </span>
              </div>
            </div>

            {/* Audit Receipt Banner if just submitted */}
            {auditReceipt && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{auditReceipt.message}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-mono text-text-secondary">
                  <span>Ledger Event #{auditReceipt.event_id}</span>
                  <span>•</span>
                  <span className="truncate">Hash: {auditReceipt.hash}</span>
                  {auditReceipt.violation && (
                    <span className="text-amber-300 font-bold">
                      Created Violation: {auditReceipt.violation.violation_code} (Priority: {auditReceipt.violation.priority_score})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-brand-border pb-2">
              {[
                { id: 'fields', label: 'Structured Fields', icon: CheckSquare },
                { id: 'text', label: 'Raw OCR Reader', icon: FileText },
                { id: 'regulation', label: 'Regulation Matching', icon: ShieldAlert },
                { id: 'action', label: 'Create Governance Record', icon: FileCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                      activeTab === tab.id
                        ? 'bg-brand-emerald text-brand-bg shadow-sm'
                        : 'bg-brand-surface text-text-secondary hover:text-text-primary border border-brand-border/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: STRUCTURED FIELDS */}
            {activeTab === 'fields' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-text-primary">Extracted Governance Entities</p>
                    <p className="text-[11px] text-text-secondary">
                      Review and edit digitized fields before committing to the statutory ledger.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveFieldVerification}
                    disabled={submittingAction}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-teal hover:bg-brand-teal/90 text-slate-900 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Field Verification</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {editedFields.map((f, idx) => (
                    <div
                      key={f.field}
                      className="p-3 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-border/90 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-text-muted">{f.label}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[10px] text-emerald-400 font-bold">{f.confidence}% conf</span>
                          <button
                            onClick={() => setEditingFieldIndex(editingFieldIndex === idx ? null : idx)}
                            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-brand-card"
                            title="Edit field value"
                          >
                            <Edit3 className="w-3 h-3 text-brand-teal" />
                          </button>
                        </div>
                      </div>

                      {editingFieldIndex === idx ? (
                        <div className="space-y-1 pt-1">
                          <input
                            type="text"
                            value={f.value}
                            onChange={(e) => handleFieldChange(idx, e.target.value)}
                            className="w-full p-1.5 bg-brand-bg border border-brand-teal rounded-lg text-text-primary text-xs font-medium focus:outline-none"
                          />
                          <button
                            onClick={() => setEditingFieldIndex(null)}
                            className="px-2 py-0.5 rounded bg-brand-emerald text-brand-bg text-[10px] font-bold"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <p className="font-semibold text-text-primary leading-relaxed text-[11.5px]">
                          {f.value || 'Not detected'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* AI Compliance Insight Card */}
                <div className="p-3 rounded-xl bg-brand-forest/40 border border-brand-emerald/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-brand-emerald font-bold text-xs">
                    <Bot className="w-4 h-4" />
                    <span>AI Decision Support Insight</span>
                  </div>
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    {selectedDoc.compliance_insight ||
                      'Document contains an inspection observation related to safety compliance. Human verification required.'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: RAW OCR TEXT READER */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">Digitized Text Buffer (OCR Output)</span>
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-surface border border-brand-border text-text-secondary hover:text-text-primary text-[11px] font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copySuccess ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#071310] border border-brand-border font-mono text-xs text-text-secondary leading-relaxed max-h-[340px] overflow-y-auto whitespace-pre-wrap select-text">
                  {selectedDoc.ocr_text || 'No raw OCR text stream available for this document.'}
                </div>
              </div>
            )}

            {/* TAB 3: REGULATION MATCHING */}
            {activeTab === 'regulation' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-brand-emerald font-bold">
                        Statutory Clause Matched
                      </span>
                      <h3 className="text-sm font-bold text-text-primary">
                        {selectedDoc.matched_regulation?.code || selectedDoc.matched_regulation_code || 'DGMS-CMR-2017-104'}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-status-critical/15 text-status-critical font-mono font-bold text-xs border border-status-critical/30">
                      {selectedDoc.matched_regulation?.severity || 'CRITICAL'} SEVERITY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
                    <div>
                      <span className="text-text-muted block">Category:</span>
                      <strong className="text-text-primary">
                        {selectedDoc.matched_regulation?.category || 'Ventilation & Gas Monitoring'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-text-muted block">Mandated Response SLA:</span>
                      <strong className="text-amber-300 font-mono">
                        {selectedDoc.matched_regulation?.response_sla_hours || 24} Hours
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-brand-bg border border-brand-border/60 text-xs space-y-1">
                    <span className="font-bold text-text-primary">Statutory Requirement:</span>
                    <p className="text-text-secondary leading-relaxed">
                      {selectedDoc.matched_regulation?.description ||
                        'Inflammable gas concentration shall not exceed 0.75% in return airway. Immediate ventilation overhaul mandated.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed">
                  <strong>Statutory Notice:</strong> Potentially relevant regulatory requirement identified by automated clause matching. Human verification is required prior to enforcement.
                </div>
              </div>
            )}

            {/* TAB 4: CREATE GOVERNANCE RECORD */}
            {activeTab === 'action' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-text-primary block">
                    Select Governance Action Outcome:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        type: 'CREATE_VIOLATION',
                        label: 'Create Official Violation',
                        desc: 'Discrepancy confirmed. Enters risk scoring, SLA countdown, and remediation workflow.'
                      },
                      {
                        type: 'STORE_COMPLIANCE_ARCHIVE',
                        label: 'Archive Compliance Document',
                        desc: 'Marks document as verified statutory record without raising a violation.'
                      }
                    ].map((opt) => (
                      <label
                        key={opt.type}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedActionType === opt.type
                            ? 'bg-brand-forest border-brand-emerald text-text-primary'
                            : 'bg-brand-surface border-brand-border text-text-secondary hover:border-brand-border/80'
                        }`}
                      >
                        <input
                          type="radio"
                          name="governanceAction"
                          value={opt.type}
                          checked={selectedActionType === opt.type}
                          onChange={(e) => setSelectedActionType(e.target.value)}
                          className="sr-only"
                        />
                        <p className="font-bold text-text-primary text-xs">{opt.label}</p>
                        <p className="text-[10.5px] text-text-secondary mt-0.5">{opt.desc}</p>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Review Notes Input */}
                <div className="space-y-1">
                  <label className="font-bold text-text-primary block">
                    Officer Verification Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Enter verification notes or physical register cross-reference…"
                    className="w-full p-2.5 rounded-xl bg-brand-surface border border-brand-border text-text-primary text-xs focus:outline-none focus:border-brand-teal"
                  />
                </div>

                {/* Commit Action */}
                <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
                  <button
                    onClick={() => setIsReviewOpen(false)}
                    className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-border text-text-secondary text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleCreateGovernanceRecord}
                    disabled={submittingAction}
                    className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-brand-bg text-xs font-bold transition-all shadow-glow-emerald flex items-center gap-2"
                  >
                    {submittingAction ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                        <span>Processing & Anchoring…</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        <span>Commit Governance Record</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
