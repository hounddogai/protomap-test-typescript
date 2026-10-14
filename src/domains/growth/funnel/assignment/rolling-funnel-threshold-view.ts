import * as text from "../../../../kit/text.js";
import { RollingFunnelThreshold } from "./rolling-funnel-threshold.js";

/** How screens and exports show a rolling funnel threshold. */
export class RollingFunnelThresholdView {
  codeText: string;
  titleText: string;
  campaignRef: string;
  unit: string;
  approved: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    campaignRef: string,
    unit: string,
    approved: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.approved = approved;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFunnelThresholdView(item: RollingFunnelThreshold): RollingFunnelThresholdView {
  return new RollingFunnelThresholdView(
    item.code,
    item.title,
    item.campaignRef,
    text.truncate(item.unit, 80),
    `${item.approved}`,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFunnelThresholdViews(items: RollingFunnelThreshold[]): RollingFunnelThresholdView[] {
  const views: RollingFunnelThresholdView[] = [];
  for (const item of items) {
    views.push(toRollingFunnelThresholdView(item));
  }
  return views;
}

export function sumRollingFunnelThresholdView(view: RollingFunnelThresholdView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
