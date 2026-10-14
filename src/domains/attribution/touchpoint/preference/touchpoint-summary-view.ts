import * as text from "../../../../kit/text.js";
import { TouchpointSummary } from "./touchpoint-summary.js";

/** How screens and exports show a touchpoint summary. */
export class TouchpointSummaryView {
  code: string;
  label: string;
  currency: string;
  impressionsText: string;
  approved: string;
  cost: string;
  scoreText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    currency: string,
    impressionsText: string,
    approved: string,
    cost: string,
    scoreText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.impressionsText = impressionsText;
    this.approved = approved;
    this.cost = cost;
    this.scoreText = scoreText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointSummaryView(item: TouchpointSummary): TouchpointSummaryView {
  return new TouchpointSummaryView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.currency, 120),
    String(item.impressions),
    `${item.approved}`,
    item.cost.toFixed(2),
    item.score.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointSummaryViews(items: TouchpointSummary[]): TouchpointSummaryView[] {
  const views: TouchpointSummaryView[] = [];
  for (const item of items) {
    views.push(toTouchpointSummaryView(item));
  }
  return views;
}

export function sumTouchpointSummaryView(view: TouchpointSummaryView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedImpressions + parsedCost + parsedScore;
}
