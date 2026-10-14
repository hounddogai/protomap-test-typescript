import * as text from "../../../../kit/text.js";
import { WeightedMentionAudit } from "./weighted-mention-audit.js";

/** How screens and exports show a weighted mention audit. */
export class WeightedMentionAuditView {
  code: string;
  label: string;
  journeyId: string;
  score: string;
  locale: string;
  statusLabel: string;

  constructor(code: string, label: string, journeyId: string, score: string, locale: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.score = score;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedMentionAuditView(item: WeightedMentionAudit): WeightedMentionAuditView {
  return new WeightedMentionAuditView(
    text.truncate(item.code, 120),
    item.label,
    text.truncate(item.journeyId, 80),
    item.score.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedMentionAuditViews(items: WeightedMentionAudit[]): WeightedMentionAuditView[] {
  const views: WeightedMentionAuditView[] = [];
  for (const item of items) {
    views.push(toWeightedMentionAuditView(item));
  }
  return views;
}

export function sumWeightedMentionAuditView(view: WeightedMentionAuditView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
