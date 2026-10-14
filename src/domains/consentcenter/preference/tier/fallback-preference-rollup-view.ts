import { FallbackPreferenceRollup } from "./fallback-preference-rollup.js";

/** How screens and exports show a fallback preference rollup. */
export class FallbackPreferenceRollupView {
  code: string;
  label: string;
  variant: string;
  attempts: string;
  budget: string;
  sequenceText: string;
  amount: string;
  floorValue: string;
  countryText: string;
  bidText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    variant: string,
    attempts: string,
    budget: string,
    sequenceText: string,
    amount: string,
    floorValue: string,
    countryText: string,
    bidText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.attempts = attempts;
    this.budget = budget;
    this.sequenceText = sequenceText;
    this.amount = amount;
    this.floorValue = floorValue;
    this.countryText = countryText;
    this.bidText = bidText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPreferenceRollupView(item: FallbackPreferenceRollup): FallbackPreferenceRollupView {
  return new FallbackPreferenceRollupView(
    item.code,
    item.label,
    item.variant,
    String(item.attempts),
    item.budget.toFixed(2),
    String(item.sequence),
    item.amount.toFixed(2),
    item.floorValue.toFixed(2),
    item.country,
    item.bid.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPreferenceRollupViews(items: FallbackPreferenceRollup[]): FallbackPreferenceRollupView[] {
  const views: FallbackPreferenceRollupView[] = [];
  for (const item of items) {
    views.push(toFallbackPreferenceRollupView(item));
  }
  return views;
}

export function sumFallbackPreferenceRollupView(view: FallbackPreferenceRollupView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedAttempts + parsedBudget + parsedSequence;
}
