import * as text from "../../../../kit/text.js";
import { LegacyComplaintProposal } from "./legacy-complaint-proposal.js";

/** How screens and exports show a legacy complaint proposal. */
export class LegacyComplaintProposalView {
  code: string;
  label: string;
  margin: string;
  timezone: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    margin: string,
    timezone: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.timezone = timezone;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyComplaintProposalView(item: LegacyComplaintProposal): LegacyComplaintProposalView {
  return new LegacyComplaintProposalView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    text.truncate(item.timezone, 80),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyComplaintProposalViews(items: LegacyComplaintProposal[]): LegacyComplaintProposalView[] {
  const views: LegacyComplaintProposalView[] = [];
  for (const item of items) {
    views.push(toLegacyComplaintProposalView(item));
  }
  return views;
}

export function sumLegacyComplaintProposalView(view: LegacyComplaintProposalView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedMargin + parsedOpenRate;
}
