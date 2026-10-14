import * as text from "../../../../kit/text.js";
import { DoubleOptInProposal } from "./double-opt-in-proposal.js";

/** How screens and exports show a double opt in proposal. */
export class DoubleOptInProposalView {
  code: string;
  title: string;
  durationMinutes: string;
  openRateText: string;
  conversionRate: string;
  impressions: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    durationMinutes: string,
    openRateText: string,
    conversionRate: string,
    impressions: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.openRateText = openRateText;
    this.conversionRate = conversionRate;
    this.impressions = impressions;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInProposalView(item: DoubleOptInProposal): DoubleOptInProposalView {
  return new DoubleOptInProposalView(
    text.truncate(item.code, 80),
    item.title,
    String(item.durationMinutes),
    item.openRate.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.impressions),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInProposalViews(items: DoubleOptInProposal[]): DoubleOptInProposalView[] {
  const views: DoubleOptInProposalView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInProposalView(item));
  }
  return views;
}

export function sumDoubleOptInProposalView(view: DoubleOptInProposalView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedDurationMinutes + parsedOpenRate + parsedConversionRate;
}
