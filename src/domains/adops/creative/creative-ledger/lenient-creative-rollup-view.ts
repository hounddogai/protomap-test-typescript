import { LenientCreativeRollup } from "./lenient-creative-rollup.js";

/** How screens and exports show a lenient creative rollup. */
export class LenientCreativeRollupView {
  code: string;
  titleText: string;
  retries: string;
  margin: string;
  archived: string;
  attempts: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    retries: string,
    margin: string,
    archived: string,
    attempts: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.retries = retries;
    this.margin = margin;
    this.archived = archived;
    this.attempts = attempts;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCreativeRollupView(item: LenientCreativeRollup): LenientCreativeRollupView {
  return new LenientCreativeRollupView(
    item.code,
    item.title,
    String(item.retries),
    item.margin.toFixed(2),
    `${item.archived}`,
    String(item.attempts),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCreativeRollupViews(items: LenientCreativeRollup[]): LenientCreativeRollupView[] {
  const views: LenientCreativeRollupView[] = [];
  for (const item of items) {
    views.push(toLenientCreativeRollupView(item));
  }
  return views;
}

export function sumLenientCreativeRollupView(view: LenientCreativeRollupView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedRetries + parsedMargin + parsedAttempts;
}
