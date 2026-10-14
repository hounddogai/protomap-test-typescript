import * as text from "../../../../kit/text.js";
import { TierBaseline } from "./tier-baseline.js";

/** How screens and exports show a tier baseline. */
export class TierBaselineView {
  codeText: string;
  label: string;
  checksum: string;
  locale: string;
  campaignRef: string;
  notesText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    checksum: string,
    locale: string,
    campaignRef: string,
    notesText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.checksum = checksum;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.notesText = notesText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toTierBaselineView(item: TierBaseline): TierBaselineView {
  return new TierBaselineView(
    item.code,
    item.label,
    item.checksum,
    text.truncate(item.locale, 80),
    text.truncate(item.campaignRef, 40),
    item.notes,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierBaselineViews(items: TierBaseline[]): TierBaselineView[] {
  const views: TierBaselineView[] = [];
  for (const item of items) {
    views.push(toTierBaselineView(item));
  }
  return views;
}

export function sumTierBaselineView(view: TierBaselineView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
