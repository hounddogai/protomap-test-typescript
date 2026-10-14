import { PrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

/** How screens and exports show a primary sender checkpoint. */
export class PrimarySenderCheckpointView {
  code: string;
  name: string;
  archived: string;
  campaignRef: string;
  budgetText: string;
  graceDaysText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    archived: string,
    campaignRef: string,
    budgetText: string,
    graceDaysText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.budgetText = budgetText;
    this.graceDaysText = graceDaysText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySenderCheckpointView(item: PrimarySenderCheckpoint): PrimarySenderCheckpointView {
  return new PrimarySenderCheckpointView(
    item.code,
    item.name,
    `${item.archived}`,
    item.campaignRef,
    item.budget.toFixed(2),
    String(item.graceDays),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySenderCheckpointViews(items: PrimarySenderCheckpoint[]): PrimarySenderCheckpointView[] {
  const views: PrimarySenderCheckpointView[] = [];
  for (const item of items) {
    views.push(toPrimarySenderCheckpointView(item));
  }
  return views;
}

export function sumPrimarySenderCheckpointView(view: PrimarySenderCheckpointView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedBudget + parsedGraceDays + parsedCapacity;
}
