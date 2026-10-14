import * as text from "../../../../kit/text.js";
import { RollingWarmupTemplate } from "./rolling-warmup-template.js";

/** How screens and exports show a rolling warmup template. */
export class RollingWarmupTemplateView {
  code: string;
  titleText: string;
  notes: string;
  archivedText: string;
  budget: string;
  contactEmail: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    notes: string,
    archivedText: string,
    budget: string,
    contactEmail: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.notes = notes;
    this.archivedText = archivedText;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toRollingWarmupTemplateView(item: RollingWarmupTemplate): RollingWarmupTemplateView {
  return new RollingWarmupTemplateView(
    text.truncate(item.code, 120),
    item.title,
    item.notes,
    `${item.archived}`,
    item.budget.toFixed(2),
    item.contactEmail,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingWarmupTemplateViews(items: RollingWarmupTemplate[]): RollingWarmupTemplateView[] {
  const views: RollingWarmupTemplateView[] = [];
  for (const item of items) {
    views.push(toRollingWarmupTemplateView(item));
  }
  return views;
}

export function sumRollingWarmupTemplateView(view: RollingWarmupTemplateView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedBudget + parsedScore;
}
