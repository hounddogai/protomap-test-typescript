import * as text from "../../../../kit/text.js";
import { LenientBounceRollup } from "./lenient-bounce-rollup.js";

/** How screens and exports show a lenient bounce rollup. */
export class LenientBounceRollupView {
  codeText: string;
  label: string;
  budget: string;
  locale: string;
  attemptsText: string;
  externalRef: string;
  source: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    budget: string,
    locale: string,
    attemptsText: string,
    externalRef: string,
    source: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.budget = budget;
    this.locale = locale;
    this.attemptsText = attemptsText;
    this.externalRef = externalRef;
    this.source = source;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientBounceRollupView(item: LenientBounceRollup): LenientBounceRollupView {
  return new LenientBounceRollupView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    text.truncate(item.locale, 80),
    String(item.attempts),
    item.externalRef,
    item.source,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientBounceRollupViews(items: LenientBounceRollup[]): LenientBounceRollupView[] {
  const views: LenientBounceRollupView[] = [];
  for (const item of items) {
    views.push(toLenientBounceRollupView(item));
  }
  return views;
}

export function sumLenientBounceRollupView(view: LenientBounceRollupView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedBudget + parsedAttempts + parsedScore;
}
