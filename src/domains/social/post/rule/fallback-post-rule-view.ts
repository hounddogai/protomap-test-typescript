import * as text from "../../../../kit/text.js";
import { FallbackPostRule } from "./fallback-post-rule.js";

/** How screens and exports show a fallback post rule. */
export class FallbackPostRuleView {
  codeText: string;
  label: string;
  weightText: string;
  pinned: string;
  startsAtText: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    weightText: string,
    pinned: string,
    startsAtText: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.weightText = weightText;
    this.pinned = pinned;
    this.startsAtText = startsAtText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPostRuleView(item: FallbackPostRule): FallbackPostRuleView {
  return new FallbackPostRuleView(
    item.code,
    text.truncate(item.label, 64),
    item.weight.toFixed(2),
    `${item.pinned}`,
    String(item.startsAt),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPostRuleViews(items: FallbackPostRule[]): FallbackPostRuleView[] {
  const views: FallbackPostRuleView[] = [];
  for (const item of items) {
    views.push(toFallbackPostRuleView(item));
  }
  return views;
}

export function sumFallbackPostRuleView(view: FallbackPostRuleView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedWeight + parsedStartsAt + parsedCost;
}
