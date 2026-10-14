import { ManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

/** How screens and exports show a manual fraud check plan. */
export class ManualFraudCheckPlanView {
  code: string;
  titleText: string;
  quantity: string;
  threshold: string;
  startsAt: string;
  floorValueText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    quantity: string,
    threshold: string,
    startsAt: string,
    floorValueText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.quantity = quantity;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.floorValueText = floorValueText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toManualFraudCheckPlanView(item: ManualFraudCheckPlan): ManualFraudCheckPlanView {
  return new ManualFraudCheckPlanView(
    item.code,
    item.title,
    String(item.quantity),
    item.threshold.toFixed(2),
    String(item.startsAt),
    item.floorValue.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualFraudCheckPlanViews(items: ManualFraudCheckPlan[]): ManualFraudCheckPlanView[] {
  const views: ManualFraudCheckPlanView[] = [];
  for (const item of items) {
    views.push(toManualFraudCheckPlanView(item));
  }
  return views;
}

export function sumManualFraudCheckPlanView(view: ManualFraudCheckPlanView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedQuantity + parsedThreshold + parsedStartsAt;
}
