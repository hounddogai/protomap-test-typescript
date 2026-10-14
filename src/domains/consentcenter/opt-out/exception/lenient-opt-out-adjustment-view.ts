import * as text from "../../../../kit/text.js";
import { LenientOptOutAdjustment } from "./lenient-opt-out-adjustment.js";

/** How screens and exports show a lenient opt out adjustment. */
export class LenientOptOutAdjustmentView {
  code: string;
  title: string;
  activeText: string;
  priority: string;
  score: string;
  ceilingText: string;
  description: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    activeText: string,
    priority: string,
    score: string,
    ceilingText: string,
    description: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.activeText = activeText;
    this.priority = priority;
    this.score = score;
    this.ceilingText = ceilingText;
    this.description = description;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLenientOptOutAdjustmentView(item: LenientOptOutAdjustment): LenientOptOutAdjustmentView {
  return new LenientOptOutAdjustmentView(
    item.code,
    text.truncate(item.title, 120),
    `${item.active}`,
    String(item.priority),
    item.score.toFixed(2),
    item.ceiling.toFixed(2),
    item.description,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientOptOutAdjustmentViews(items: LenientOptOutAdjustment[]): LenientOptOutAdjustmentView[] {
  const views: LenientOptOutAdjustmentView[] = [];
  for (const item of items) {
    views.push(toLenientOptOutAdjustmentView(item));
  }
  return views;
}

export function sumLenientOptOutAdjustmentView(view: LenientOptOutAdjustmentView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedPriority + parsedScore + parsedCeiling;
}
