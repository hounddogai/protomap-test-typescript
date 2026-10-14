import * as text from "../../../../kit/text.js";
import { EscalationSnapshot } from "./escalation-snapshot.js";

/** How screens and exports show a escalation snapshot. */
export class EscalationSnapshotView {
  code: string;
  title: string;
  active: string;
  categoryText: string;
  score: string;
  conversionRateText: string;
  journeyIdText: string;
  openRate: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    active: string,
    categoryText: string,
    score: string,
    conversionRateText: string,
    journeyIdText: string,
    openRate: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.categoryText = categoryText;
    this.score = score;
    this.conversionRateText = conversionRateText;
    this.journeyIdText = journeyIdText;
    this.openRate = openRate;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationSnapshotView(item: EscalationSnapshot): EscalationSnapshotView {
  return new EscalationSnapshotView(
    item.code,
    text.truncate(item.title, 80),
    `${item.active}`,
    item.category,
    item.score.toFixed(2),
    item.conversionRate.toFixed(2),
    item.journeyId,
    item.openRate.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationSnapshotViews(items: EscalationSnapshot[]): EscalationSnapshotView[] {
  const views: EscalationSnapshotView[] = [];
  for (const item of items) {
    views.push(toEscalationSnapshotView(item));
  }
  return views;
}

export function sumEscalationSnapshotView(view: EscalationSnapshotView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedScore + parsedConversionRate + parsedOpenRate;
}
