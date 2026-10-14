import { SeasonalDeflectionPolicy } from "./seasonal-deflection-policy.js";

/** How screens and exports show a seasonal deflection policy. */
export class SeasonalDeflectionPolicyView {
  codeText: string;
  title: string;
  graceDays: string;
  priority: string;
  variant: string;
  notesText: string;
  budget: string;
  source: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    graceDays: string,
    priority: string,
    variant: string,
    notesText: string,
    budget: string,
    source: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.graceDays = graceDays;
    this.priority = priority;
    this.variant = variant;
    this.notesText = notesText;
    this.budget = budget;
    this.source = source;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalDeflectionPolicyView(item: SeasonalDeflectionPolicy): SeasonalDeflectionPolicyView {
  return new SeasonalDeflectionPolicyView(
    item.code,
    item.title,
    String(item.graceDays),
    String(item.priority),
    item.variant,
    item.notes,
    item.budget.toFixed(2),
    item.source,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalDeflectionPolicyViews(items: SeasonalDeflectionPolicy[]): SeasonalDeflectionPolicyView[] {
  const views: SeasonalDeflectionPolicyView[] = [];
  for (const item of items) {
    views.push(toSeasonalDeflectionPolicyView(item));
  }
  return views;
}

export function sumSeasonalDeflectionPolicyView(view: SeasonalDeflectionPolicyView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedGraceDays + parsedPriority + parsedBudget;
}
