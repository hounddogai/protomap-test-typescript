import * as text from "../../../../kit/text.js";
import { FallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

/** How screens and exports show a fallback exit rule cycle. */
export class FallbackExitRuleCycleView {
  code: string;
  nameText: string;
  budget: string;
  score: string;
  attempts: string;
  version: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budget: string,
    score: string,
    attempts: string,
    version: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budget = budget;
    this.score = score;
    this.attempts = attempts;
    this.version = version;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackExitRuleCycleView(item: FallbackExitRuleCycle): FallbackExitRuleCycleView {
  return new FallbackExitRuleCycleView(
    item.code,
    text.truncate(item.name, 40),
    item.budget.toFixed(2),
    item.score.toFixed(2),
    String(item.attempts),
    String(item.version),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackExitRuleCycleViews(items: FallbackExitRuleCycle[]): FallbackExitRuleCycleView[] {
  const views: FallbackExitRuleCycleView[] = [];
  for (const item of items) {
    views.push(toFallbackExitRuleCycleView(item));
  }
  return views;
}

export function sumFallbackExitRuleCycleView(view: FallbackExitRuleCycleView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedBudget + parsedScore + parsedAttempts;
}
