import * as text from "../../../../kit/text.js";
import { SlaOverride } from "./sla-override.js";

/** How screens and exports show a sla override. */
export class SlaOverrideView {
  codeText: string;
  name: string;
  ceilingText: string;
  label: string;
  title: string;
  pinnedText: string;
  budgetText: string;
  variantText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ceilingText: string,
    label: string,
    title: string,
    pinnedText: string,
    budgetText: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ceilingText = ceilingText;
    this.label = label;
    this.title = title;
    this.pinnedText = pinnedText;
    this.budgetText = budgetText;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaOverrideView(item: SlaOverride): SlaOverrideView {
  return new SlaOverrideView(
    item.code,
    item.name,
    item.ceiling.toFixed(2),
    item.label,
    text.truncate(item.title, 120),
    `${item.pinned}`,
    item.budget.toFixed(2),
    text.truncate(item.variant, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaOverrideViews(items: SlaOverride[]): SlaOverrideView[] {
  const views: SlaOverrideView[] = [];
  for (const item of items) {
    views.push(toSlaOverrideView(item));
  }
  return views;
}

export function sumSlaOverrideView(view: SlaOverrideView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedCeiling + parsedBudget;
}
