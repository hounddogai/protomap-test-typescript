import { PrimarySenderPlan } from "./primary-sender-plan.js";

/** How screens and exports show a primary sender plan. */
export class PrimarySenderPlanView {
  codeText: string;
  labelText: string;
  pinned: string;
  weightText: string;
  statusLabel: string;

  constructor(codeText: string, labelText: string, pinned: string, weightText: string, statusLabel: string) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.pinned = pinned;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySenderPlanView(item: PrimarySenderPlan): PrimarySenderPlanView {
  return new PrimarySenderPlanView(
    item.code,
    item.label,
    `${item.pinned}`,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySenderPlanViews(items: PrimarySenderPlan[]): PrimarySenderPlanView[] {
  const views: PrimarySenderPlanView[] = [];
  for (const item of items) {
    views.push(toPrimarySenderPlanView(item));
  }
  return views;
}

export function sumPrimarySenderPlanView(view: PrimarySenderPlanView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedWeight;
}
