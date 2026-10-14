import { RollingFlightBudget } from "./rolling-flight-budget.js";

/** How screens and exports show a rolling flight budget. */
export class RollingFlightBudgetView {
  code: string;
  labelText: string;
  archived: string;
  channelText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    archived: string,
    channelText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.archived = archived;
    this.channelText = channelText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFlightBudgetView(item: RollingFlightBudget): RollingFlightBudgetView {
  return new RollingFlightBudgetView(
    item.code,
    item.label,
    `${item.archived}`,
    item.channel,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFlightBudgetViews(items: RollingFlightBudget[]): RollingFlightBudgetView[] {
  const views: RollingFlightBudgetView[] = [];
  for (const item of items) {
    views.push(toRollingFlightBudgetView(item));
  }
  return views;
}

export function sumRollingFlightBudgetView(view: RollingFlightBudgetView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
