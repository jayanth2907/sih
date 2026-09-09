import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Building2, AlertOctagon, ClipboardCheck, FileText, ArrowRight, X } from 'lucide-react';
import { mineService } from '../../services/mineService';
import { violationService } from '../../services/violationService';
import { documentService } from '../../services/documentService';

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [mines, setMines] = useState([]);
  const [violations, setViolations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose ? (isOpen ? onClose() : null) : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [mList, vList, dList] = await Promise.all([
          mineService.getMines().catch(() => []),
          violationService.getViolations().catch(() => []),
          documentService.getDocuments().catch(() => []),
        ]);
        setMines(mList || []);
        setViolations(vList || []);
        setDocuments(dList || []);
      } catch (err) {
        // Silent catch
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredMines = mines.filter(m =>
    !q || m.name?.toLowerCase().includes(q) || m.mine_code?.toLowerCase().includes(q) || m.subsidiary?.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredViolations = violations.filter(v =>
    !q || v.violation_code?.toLowerCase().includes(q) || v.title?.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredDocs = documents.filter(d =>
    !q || d.matched_regulation_code?.toLowerCase().includes(q) || d.document_type?.toLowerCase().includes(q)
  ).slice(0, 3);

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-2xl bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-brand-border bg-brand-card">
          <Search className="w-5 h-5 text-brand-emerald mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across mines, cases, inspections, regulations, or documents..."
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {/* Mines Section */}
          {filteredMines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-brand-emerald" />
                <span>Mines ({filteredMines.length})</span>
              </div>
              <div className="space-y-1">
                {filteredMines.map((mine) => (
                  <button
                    key={mine.id}
                    onClick={() => handleSelect(`/mines/${mine.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-card text-left transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary group-hover:text-brand-emerald">
                        {mine.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {mine.mine_code} • {mine.subsidiary} • Risk: {mine.risk_score}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-emerald group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Violations Section */}
          {filteredViolations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                <AlertOctagon className="w-3.5 h-3.5 text-status-critical" />
                <span>Violations & Cases ({filteredViolations.length})</span>
              </div>
              <div className="space-y-1">
                {filteredViolations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelect(`/violations/${v.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-card text-left transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-brand-teal">{v.violation_code}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-status-critical/20 text-status-critical font-semibold">
                          Risk: {v.priority_score || 50}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary font-medium mt-0.5 group-hover:text-brand-teal">
                        {v.title}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-teal group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {filteredDocs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-brand-teal" />
                <span>Digitized Register Documents ({filteredDocs.length})</span>
              </div>
              <div className="space-y-1">
                {filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelect('/documents')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-card text-left transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary group-hover:text-brand-teal">
                        {doc.document_type} (OCR Scan #{doc.id})
                      </p>
                      <p className="text-xs text-text-secondary">
                        Confidence: {(doc.ocr_confidence * 100).toFixed(0)}% • Tag: {doc.matched_regulation_code || 'General Safety'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-teal group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredMines.length === 0 && filteredViolations.length === 0 && filteredDocs.length === 0 && (
            <div className="py-8 text-center text-text-muted text-sm">
              No matching entities found for "{query}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-brand-bg/80 border-t border-brand-border flex items-center justify-between text-[11px] text-text-muted">
          <span>Tip: Use arrow keys to navigate, Esc to close</span>
          <span className="font-mono">TRINETRA Global Search</span>
        </div>
      </motion.div>
    </div>
  );
};
