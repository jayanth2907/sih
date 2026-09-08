import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { auditService } from '../../services/auditService';

export const RecentActivityTimeline = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchActivities = async () => {
      try {
        const res = await auditService.getLogs({ limit: 8 });
        const list = Array.isArray(res) ? res : (res?.logs || []);
        if (isMounted) {
          const mapped = list.map((log) => {
            const timeStr = log.timestamp ? log.timestamp.split('T')[1]?.slice(0, 5) || "Just now" : "Just now";
            let color = "bg-status-success";
            const actUpper = (log.action || "").toUpperCase();
            if (actUpper.includes("BREACH") || actUpper.includes("CRITICAL") || actUpper.includes("ESCALAT")) {
              color = "bg-status-critical";
            } else if (actUpper.includes("VIOLATION")) {
              color = "bg-amber-400";
            } else if (actUpper.includes("ACTION") || actUpper.includes("CORRECTIVE")) {
              color = "bg-brand-teal";
            } else if (actUpper.includes("OCR") || actUpper.includes("DOCUMENT")) {
              color = "bg-brand-emerald";
            }
            return {
              time: timeStr,
              title: log.action ? log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()) : "System Event",
              entity: `${log.entity_type} #${log.entity_id} (${log.performed_by_name || 'System'})`,
              color
            };
          });
          setActivities(mapped);
        }
      } catch (err) {
        if (isMounted) {
          setActivities([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchActivities();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col justify-between shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Recent Activity</h3>
          <p className="text-[11px] text-text-secondary">Live updates across all mines</p>
        </div>

        <button
          onClick={() => navigate('/audit')}
          className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-brand-emerald transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3.5 flex-1">
        {loading ? (
          <p className="text-xs text-text-muted py-4 text-center">Loading audit events...</p>
        ) : activities.length > 0 ? (
          activities.map((act, index) => (
            <div key={index} className="flex items-start gap-3 group">
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${act.color} flex-shrink-0`} />
                <span className="text-[11px] font-mono text-text-muted">{act.time}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary group-hover:text-brand-emerald transition-colors truncate">
                  {act.title}
                </p>
                <p className="text-[11px] text-text-secondary font-mono truncate">
                  {act.entity}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-text-muted py-4 text-center">No recent activity recorded yet.</p>
        )}
      </div>
    </div>
  );
};
