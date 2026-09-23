import React from 'react';
import { ServiceOpportunity, ConfidenceLevel } from './opportunityTypes';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Sparkles, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: ServiceOpportunity;
  isTopPick?: boolean;
  rank?: number;
  onSelectForPitch: (opp: ServiceOpportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isTopPick,
  rank,
  onSelectForPitch
}) => {
  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'High':
        return <Badge variant="success">High Confidence</Badge>;
      case 'Medium':
        return <Badge variant="warning">Medium Confidence</Badge>;
      case 'Low':
        return <Badge variant="default">Low Confidence</Badge>;
    }
  };

  return (
    <div
      className={`border rounded-xl p-4 shadow-xs transition ${
        isTopPick
          ? 'border-blue-500/50 ring-1 ring-blue-500/30 bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900'
          : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {rank && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs shadow-blue-900">
              {rank}
            </span>
          )}
          <h4 className="text-sm font-bold text-white leading-snug">{opportunity.service}</h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {opportunity.isUserOfferedService && (
            <Badge variant="cyan">In Your Stack</Badge>
          )}
          {getConfidenceBadge(opportunity.confidence)}
        </div>
      </div>

      {/* Why pitch this section */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 mb-3 text-xs">
        <div className="flex items-center gap-1 text-sky-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Why pitch this:
        </div>
        <p className="text-slate-200 leading-relaxed">{opportunity.whyPitchThis}</p>
      </div>

      {/* Evidence */}
      <div className="space-y-1.5 text-xs text-slate-300 mb-3">
        <div>
          <span className="font-semibold text-slate-100">Evidence: </span>
          {opportunity.evidence}
        </div>
        <div>
          <span className="font-semibold text-slate-100">Sales Angle: </span>
          {opportunity.salesAngle}
        </div>
        <div>
          <span className="font-semibold text-slate-100">Suggested Deliverable: </span>
          {opportunity.suggestedDeliverable}
        </div>
      </div>

      {/* Suggested Offer & Pricing */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">Offer: </span>
          <span className="text-white font-semibold">{opportunity.suggestedOffer}</span>
          {opportunity.estimatedPricingGuide && (
            <span className="text-cyan-400 font-medium ml-1">({opportunity.estimatedPricingGuide})</span>
          )}
        </div>

        <Button
          size="xs"
          variant={isTopPick ? 'primary' : 'outline'}
          onClick={() => onSelectForPitch(opportunity)}
          className="cursor-pointer"
        >
          Draft Outreach <ArrowRight className="w-3 h-3 ml-0.5" />
        </Button>
      </div>
    </div>
  );
};
