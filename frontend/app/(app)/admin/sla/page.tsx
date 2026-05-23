"use client";
import { useState } from "react";
import { SLA_CONFIGS, PROJECTS } from "@/lib/mockData";
import { SLAConfig } from "@/types";
import { Shield, Save, Info } from "lucide-react";

export default function AdminSLAPage() {
  const [configs, setConfigs] = useState<SLAConfig[]>(SLA_CONFIGS);
  const [saved, setSaved] = useState(false);

  const update = (id: string, field: keyof SLAConfig, value: number) => {
    setConfigs((cs) => cs.map((c) => c.id === id ? { ...c, [field]: value } : c));
    setSaved(false);
  };

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const projectsWithSLA = PROJECTS.filter((p) => configs.some((c) => c.projectId === p.id));

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">SLA Configuration</h1>
          <p className="page-subtitle">Configure SLA response days per project and priority level</p>
        </div>
        <button id="save-sla-btn" onClick={handleSave} className="btn-primary">
          <Save size={16} /> {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-600/10 border border-brand-500/20 text-sm text-[#8892b0]">
        <Info size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
        <div>SLA values define the maximum number of calendar days for each workflow stage.
          Breaches trigger email escalations to responsible parties and Admin.
          <strong className="text-white"> Default: Critical 14d response / Non-Critical 21d response.</strong>
        </div>
      </div>

      {/* SLA cards per project */}
      {projectsWithSLA.map((project) => {
        const projectConfigs = configs.filter((c) => c.projectId === project.id);
        return (
          <div key={project.id} className="card">
            <div className="flex items-center gap-3 mb-6">
              <Shield size={18} className="text-brand-400" />
              <div>
                <h3 className="font-semibold text-white">{project.name}</h3>
                <span className="text-xs text-[#4a5568]">{project.code}</span>
              </div>
              <span className={`ml-auto badge ${project.isActive ? "badge-green" : "badge-gray"}`}>
                {project.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Request Validation (days)</th>
                    <th>Response (days)</th>
                    <th>Response Validation (days)</th>
                    <th>Close Out (days)</th>
                    <th>Total Max (days)</th>
                  </tr>
                </thead>
                <tbody>
                  {projectConfigs.map((cfg) => {
                    const total = cfg.daysRequestValidation + cfg.daysResponse + cfg.daysResponseValidation + cfg.daysCloseOut;
                    return (
                      <tr key={cfg.id}>
                        <td>
                          <span className={cfg.priority === "critical" ? "badge-critical" : "badge-non-critical"}>
                            {cfg.priority === "critical" ? "Critical" : "Non-Critical"}
                          </span>
                        </td>
                        {(["daysRequestValidation", "daysResponse", "daysResponseValidation", "daysCloseOut"] as const).map((field) => (
                          <td key={field}>
                            <div className="flex items-center gap-2">
                              <input
                                id={`sla-${cfg.id}-${field}`}
                                type="number"
                                min={1}
                                max={90}
                                className="input w-20 text-center"
                                value={cfg[field] as number}
                                onChange={(e) => update(cfg.id, field, parseInt(e.target.value) || 1)}
                              />
                              <span className="text-xs text-[#4a5568]">days</span>
                            </div>
                          </td>
                        ))}
                        <td>
                          <span className="font-bold text-white">{total}</span>
                          <span className="text-xs text-[#4a5568] ml-1">days</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Escalation info */}
      <div className="card border-amber-500/20 bg-amber-500/5">
        <h3 className="font-semibold text-amber-400 mb-3 text-sm flex items-center gap-2">
          <Shield size={16} /> Escalation Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#c0c8e8]">
          {[
            { label: "T-2 Days Warning", desc: "In-app + email notification to responsible party and their Manager" },
            { label: "T=0 SLA Breach", desc: "Email escalation to Admin + Manager. Dashboard alert shown" },
            { label: "T+3 Days Critical", desc: "Additional escalation email to Project Director (configurable)" },
            { label: "Weekly Report", desc: "Automated SLA compliance report emailed every Monday to Admin" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white text-sm">{label}</div>
                <div className="text-xs text-[#8892b0] mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
