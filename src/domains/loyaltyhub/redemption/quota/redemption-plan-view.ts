import * as text from "../../../../kit/text.js";
import { RedemptionPlan } from "./redemption-plan.js";

/** How screens and exports show a redemption plan. */
export class RedemptionPlanView {
  codeText: string;
  name: string;
  priority: string;
  activeText: string;
  threshold: string;
  notesText: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    priority: string,
    activeText: string,
    threshold: string,
    notesText: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.priority = priority;
    this.activeText = activeText;
    this.threshold = threshold;
    this.notesText = notesText;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionPlanView(item: RedemptionPlan): RedemptionPlanView {
  return new RedemptionPlanView(
    item.code,
    text.truncate(item.name, 64),
    String(item.priority),
    `${item.active}`,
    item.threshold.toFixed(2),
    item.notes,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionPlanViews(items: RedemptionPlan[]): RedemptionPlanView[] {
  const views: RedemptionPlanView[] = [];
  for (const item of items) {
    views.push(toRedemptionPlanView(item));
  }
  return views;
}

export function sumRedemptionPlanView(view: RedemptionPlanView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedPriority + parsedThreshold;
}
