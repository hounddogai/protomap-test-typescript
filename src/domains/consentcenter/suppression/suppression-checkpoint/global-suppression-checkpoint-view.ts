import { GlobalSuppressionCheckpoint } from "./global-suppression-checkpoint.js";

/** How screens and exports show a global suppression checkpoint. */
export class GlobalSuppressionCheckpointView {
  code: string;
  title: string;
  sendAt: string;
  discountText: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sendAt: string,
    discountText: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.discountText = discountText;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSuppressionCheckpointView(item: GlobalSuppressionCheckpoint): GlobalSuppressionCheckpointView {
  return new GlobalSuppressionCheckpointView(
    item.code,
    item.title,
    String(item.sendAt),
    item.discount.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSuppressionCheckpointViews(items: GlobalSuppressionCheckpoint[]): GlobalSuppressionCheckpointView[] {
  const views: GlobalSuppressionCheckpointView[] = [];
  for (const item of items) {
    views.push(toGlobalSuppressionCheckpointView(item));
  }
  return views;
}

export function sumGlobalSuppressionCheckpointView(view: GlobalSuppressionCheckpointView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedSendAt + parsedDiscount + parsedBudget;
}
