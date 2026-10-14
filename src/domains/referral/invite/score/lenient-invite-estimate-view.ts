import { LenientInviteEstimate } from "./lenient-invite-estimate.js";

/** How screens and exports show a lenient invite estimate. */
export class LenientInviteEstimateView {
  codeText: string;
  title: string;
  approved: string;
  summary: string;
  journeyId: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    approved: string,
    summary: string,
    journeyId: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.approved = approved;
    this.summary = summary;
    this.journeyId = journeyId;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toLenientInviteEstimateView(item: LenientInviteEstimate): LenientInviteEstimateView {
  return new LenientInviteEstimateView(
    item.code,
    item.title,
    `${item.approved}`,
    item.summary,
    item.journeyId,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientInviteEstimateViews(items: LenientInviteEstimate[]): LenientInviteEstimateView[] {
  const views: LenientInviteEstimateView[] = [];
  for (const item of items) {
    views.push(toLenientInviteEstimateView(item));
  }
  return views;
}

export function sumLenientInviteEstimateView(view: LenientInviteEstimateView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
