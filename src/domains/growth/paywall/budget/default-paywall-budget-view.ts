import * as text from "../../../../kit/text.js";
import { DefaultPaywallBudget } from "./default-paywall-budget.js";

/** How screens and exports show a default paywall budget. */
export class DefaultPaywallBudgetView {
  codeText: string;
  name: string;
  label: string;
  maximumText: string;
  frequencyCapText: string;
  endsAtText: string;
  score: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    label: string,
    maximumText: string,
    frequencyCapText: string,
    endsAtText: string,
    score: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.label = label;
    this.maximumText = maximumText;
    this.frequencyCapText = frequencyCapText;
    this.endsAtText = endsAtText;
    this.score = score;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPaywallBudgetView(item: DefaultPaywallBudget): DefaultPaywallBudgetView {
  return new DefaultPaywallBudgetView(
    text.truncate(item.code, 40),
    item.name,
    item.label,
    item.maximum.toFixed(2),
    String(item.frequencyCap),
    String(item.endsAt),
    item.score.toFixed(2),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPaywallBudgetViews(items: DefaultPaywallBudget[]): DefaultPaywallBudgetView[] {
  const views: DefaultPaywallBudgetView[] = [];
  for (const item of items) {
    views.push(toDefaultPaywallBudgetView(item));
  }
  return views;
}

export function sumDefaultPaywallBudgetView(view: DefaultPaywallBudgetView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedMaximum + parsedFrequencyCap + parsedEndsAt;
}
