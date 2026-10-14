import { ScheduledReputationAdjustment } from "./scheduled-reputation-adjustment.js";

/** How screens and exports show a scheduled reputation adjustment. */
export class ScheduledReputationAdjustmentView {
  code: string;
  title: string;
  journeyId: string;
  reviewer: string;
  labelText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    reviewer: string,
    labelText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.labelText = labelText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledReputationAdjustmentView(item: ScheduledReputationAdjustment): ScheduledReputationAdjustmentView {
  return new ScheduledReputationAdjustmentView(
    item.code,
    item.title,
    item.journeyId,
    item.reviewer,
    item.label,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledReputationAdjustmentViews(items: ScheduledReputationAdjustment[]): ScheduledReputationAdjustmentView[] {
  const views: ScheduledReputationAdjustmentView[] = [];
  for (const item of items) {
    views.push(toScheduledReputationAdjustmentView(item));
  }
  return views;
}

export function sumScheduledReputationAdjustmentView(view: ScheduledReputationAdjustmentView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
