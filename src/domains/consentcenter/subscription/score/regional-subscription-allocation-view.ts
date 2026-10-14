import { RegionalSubscriptionAllocation } from "./regional-subscription-allocation.js";

/** How screens and exports show a regional subscription allocation. */
export class RegionalSubscriptionAllocationView {
  codeText: string;
  label: string;
  expiresAt: string;
  margin: string;
  activeText: string;
  rateText: string;
  variant: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    expiresAt: string,
    margin: string,
    activeText: string,
    rateText: string,
    variant: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.activeText = activeText;
    this.rateText = rateText;
    this.variant = variant;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSubscriptionAllocationView(item: RegionalSubscriptionAllocation): RegionalSubscriptionAllocationView {
  return new RegionalSubscriptionAllocationView(
    item.code,
    item.label,
    String(item.expiresAt),
    item.margin.toFixed(2),
    `${item.active}`,
    item.rate.toFixed(2),
    item.variant,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSubscriptionAllocationViews(items: RegionalSubscriptionAllocation[]): RegionalSubscriptionAllocationView[] {
  const views: RegionalSubscriptionAllocationView[] = [];
  for (const item of items) {
    views.push(toRegionalSubscriptionAllocationView(item));
  }
  return views;
}

export function sumRegionalSubscriptionAllocationView(view: RegionalSubscriptionAllocationView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedExpiresAt + parsedMargin + parsedRate;
}
