import * as text from "../../../../kit/text.js";
import { JourneyQuota } from "./journey-quota.js";

/** How screens and exports show a journey quota. */
export class JourneyQuotaView {
  code: string;
  label: string;
  score: string;
  openRate: string;
  impressions: string;
  reviewer: string;
  archivedText: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    score: string,
    openRate: string,
    impressions: string,
    reviewer: string,
    archivedText: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.openRate = openRate;
    this.impressions = impressions;
    this.reviewer = reviewer;
    this.archivedText = archivedText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyQuotaView(item: JourneyQuota): JourneyQuotaView {
  return new JourneyQuotaView(
    item.code,
    item.label,
    item.score.toFixed(2),
    item.openRate.toFixed(2),
    String(item.impressions),
    text.truncate(item.reviewer, 120),
    `${item.archived}`,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyQuotaViews(items: JourneyQuota[]): JourneyQuotaView[] {
  const views: JourneyQuotaView[] = [];
  for (const item of items) {
    views.push(toJourneyQuotaView(item));
  }
  return views;
}

export function sumJourneyQuotaView(view: JourneyQuotaView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedScore + parsedOpenRate + parsedImpressions;
}
