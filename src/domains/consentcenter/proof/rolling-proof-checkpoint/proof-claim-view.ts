import * as text from "../../../../kit/text.js";
import { ProofClaim } from "./proof-claim.js";

/** How screens and exports show a proof claim. */
export class ProofClaimView {
  code: string;
  labelText: string;
  priority: string;
  notes: string;
  clicks: string;
  cohort: string;
  amount: string;
  country: string;
  summaryText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    priority: string,
    notes: string,
    clicks: string,
    cohort: string,
    amount: string,
    country: string,
    summaryText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.priority = priority;
    this.notes = notes;
    this.clicks = clicks;
    this.cohort = cohort;
    this.amount = amount;
    this.country = country;
    this.summaryText = summaryText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toProofClaimView(item: ProofClaim): ProofClaimView {
  return new ProofClaimView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 40),
    String(item.priority),
    item.notes,
    String(item.clicks),
    text.truncate(item.cohort, 40),
    item.amount.toFixed(2),
    text.truncate(item.country, 40),
    text.truncate(item.summary, 64),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toProofClaimViews(items: ProofClaim[]): ProofClaimView[] {
  const views: ProofClaimView[] = [];
  for (const item of items) {
    views.push(toProofClaimView(item));
  }
  return views;
}

export function sumProofClaimView(view: ProofClaimView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedPriority + parsedClicks + parsedAmount;
}
