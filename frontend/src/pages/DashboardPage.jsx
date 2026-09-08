import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../components/dashboard/HeroBanner';
import { KPIRow } from '../components/dashboard/KPIRow';
import { PriorityAttentionTable } from '../components/dashboard/PriorityAttentionTable';
import { IndiaMineRiskMap } from '../components/dashboard/IndiaMineRiskMap';
import { DashboardAnalytics } from '../components/dashboard/DashboardAnalytics';
import { RecentActivityTimeline } from '../components/dashboard/RecentActivityTimeline';
import { ComplianceDonutChart } from '../components/dashboard/ComplianceDonutChart';
import { DashboardAICopilot } from '../components/dashboard/DashboardAICopilot';
import { WhyThisRiskDrawer } from '../components/risk/WhyThisRiskDrawer';
import { dashboardService } from '../services/dashboardService';
import { mineService } from '../services/mineService';

export const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [attentionCases, setAttentionCases] = useState([]);
  const [minesList, setMinesList] = useState([]);
  const [selectedCaseForDrawer, setSelectedCaseForDrawer] = useState(null);
  const [isWhyRiskOpen, setIsWhyRiskOpen] = useState(false);

  useEffect(() => {
    // Fetch live backend metrics
    const fetchDashboardData = async () => {
      try {
        const [sumData, attData, mData] = await Promise.all([
          dashboardService.getSummary().catch(() => null),
          dashboardService.getAttention().catch(() => null),
          mineService.getMines().catch(() => null),
        ]);

        if (sumData) setSummary(sumData);
        if (attData && Array.isArray(attData)) setAttentionCases(attData);
        if (mData && Array.isArray(mData)) setMinesList(mData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSelectCase = (caseItem) => {
    setSelectedCaseForDrawer(caseItem);
    setIsWhyRiskOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Top KPI Cards Row */}
      <KPIRow summary={summary} />

      {/* 3. Middle Spatial Row: Priority Attention (65%) & India Mine Risk Map (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PriorityAttentionTable
            attentionData={attentionCases}
            onSelectCase={handleSelectCase}
          />
        </div>
        <div className="lg:col-span-4">
          <IndiaMineRiskMap minesList={minesList} />
        </div>
      </div>

      {/* 4. Lower Analytics Row (Fleet Risk Sparkline, Cadence Bar, Response Ring) */}
      <DashboardAnalytics summary={summary} />

      {/* 5. Bottom 3-Column Row: Activity Feed, Compliance Donut & AI Safety Copilot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <RecentActivityTimeline />
        </div>
        <div>
          <ComplianceDonutChart />
        </div>
        <div>
          <DashboardAICopilot />
        </div>
      </div>

      {/* 6. Why This Risk SHAP Explainability Slide-over Drawer */}
      <WhyThisRiskDrawer
        isOpen={isWhyRiskOpen}
        onClose={() => setIsWhyRiskOpen(false)}
        selectedCase={selectedCaseForDrawer}
      />
    </div>
  );
};
