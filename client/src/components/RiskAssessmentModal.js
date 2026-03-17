import React from 'react';
import { getRecommendationBadge } from '../utils/format';

export default function RiskAssessmentModal({ role, assessment, onClose }) {
  const badge = getRecommendationBadge(role.recommendation);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="card p-6 max-w-lg w-full mx-4 glow-border" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">{role.role_name}</h3>
            <p className="text-xs text-gwoe-muted mt-0.5">
              {role.level} — <span className={badge.class}>{badge.label}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gwoe-muted hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gwoe-green flex items-center gap-2 mb-2">
              <span>▲</span> Pros
            </h4>
            <ul className="space-y-1.5">
              {assessment.pros.map((p, i) => (
                <li key={i} className="text-xs text-gwoe-muted pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-gwoe-green">
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gwoe-red flex items-center gap-2 mb-2">
              <span>▼</span> Cons
            </h4>
            <ul className="space-y-1.5">
              {assessment.cons.map((c, i) => (
                <li key={i} className="text-xs text-gwoe-muted pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-gwoe-red">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gwoe-accent flex items-center gap-2 mb-2">
              <span>◆</span> Mitigation Strategy
            </h4>
            <ul className="space-y-1.5">
              {assessment.mitigation.map((m, i) => (
                <li key={i} className="text-xs text-gwoe-muted pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-gwoe-accent">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gwoe-border flex justify-end">
          <button onClick={onClose} className="btn-secondary text-xs">Close</button>
        </div>
      </div>
    </div>
  );
}
