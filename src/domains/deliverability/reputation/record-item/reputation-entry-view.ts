import { ReputationEntry } from "./reputation-entry.js";

/** How screens and exports show a reputation entry. */
export class ReputationEntryView {
  code: string;
  label: string;
  quantityText: string;
  updatedAt: string;
  timezone: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantityText: string,
    updatedAt: string,
    timezone: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantityText = quantityText;
    this.updatedAt = updatedAt;
    this.timezone = timezone;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toReputationEntryView(item: ReputationEntry): ReputationEntryView {
  return new ReputationEntryView(
    item.code,
    item.label,
    String(item.quantity),
    String(item.updatedAt),
    item.timezone,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationEntryViews(items: ReputationEntry[]): ReputationEntryView[] {
  const views: ReputationEntryView[] = [];
  for (const item of items) {
    views.push(toReputationEntryView(item));
  }
  return views;
}

export function sumReputationEntryView(view: ReputationEntryView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedQuantity + parsedUpdatedAt + parsedStartsAt;
}
