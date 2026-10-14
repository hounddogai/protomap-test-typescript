import { CappedPaywallMetric } from "./capped-paywall-metric.js";

/** How screens and exports show a capped paywall metric. */
export class CappedPaywallMetricView {
  code: string;
  title: string;
  amount: string;
  score: string;
  bid: string;
  summary: string;
  audienceId: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    amount: string,
    score: string,
    bid: string,
    summary: string,
    audienceId: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.score = score;
    this.bid = bid;
    this.summary = summary;
    this.audienceId = audienceId;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPaywallMetricView(item: CappedPaywallMetric): CappedPaywallMetricView {
  return new CappedPaywallMetricView(
    item.code,
    item.title,
    item.amount.toFixed(2),
    item.score.toFixed(2),
    item.bid.toFixed(2),
    item.summary,
    item.audienceId,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPaywallMetricViews(items: CappedPaywallMetric[]): CappedPaywallMetricView[] {
  const views: CappedPaywallMetricView[] = [];
  for (const item of items) {
    views.push(toCappedPaywallMetricView(item));
  }
  return views;
}

export function sumCappedPaywallMetricView(view: CappedPaywallMetricView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedAmount + parsedScore + parsedBid;
}
