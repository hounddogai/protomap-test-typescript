import * as text from "../../../../kit/text.js";
import { StrictMentionPlan } from "./strict-mention-plan.js";

/** How screens and exports show a strict mention plan. */
export class StrictMentionPlanView {
  code: string;
  labelText: string;
  variantText: string;
  notes: string;
  sequenceText: string;
  attempts: string;
  approved: string;
  active: string;
  regionText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    variantText: string,
    notes: string,
    sequenceText: string,
    attempts: string,
    approved: string,
    active: string,
    regionText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.variantText = variantText;
    this.notes = notes;
    this.sequenceText = sequenceText;
    this.attempts = attempts;
    this.approved = approved;
    this.active = active;
    this.regionText = regionText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toStrictMentionPlanView(item: StrictMentionPlan): StrictMentionPlanView {
  return new StrictMentionPlanView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.variant, 64),
    item.notes,
    String(item.sequence),
    String(item.attempts),
    `${item.approved}`,
    `${item.active}`,
    item.region,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictMentionPlanViews(items: StrictMentionPlan[]): StrictMentionPlanView[] {
  const views: StrictMentionPlanView[] = [];
  for (const item of items) {
    views.push(toStrictMentionPlanView(item));
  }
  return views;
}

export function sumStrictMentionPlanView(view: StrictMentionPlanView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedSequence + parsedAttempts + parsedScore;
}
