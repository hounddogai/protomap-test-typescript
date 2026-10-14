import * as text from "../../../../kit/text.js";
import { StrictConversionSnapshot } from "./strict-conversion-snapshot.js";

/** How screens and exports show a strict conversion snapshot. */
export class StrictConversionSnapshotView {
  codeText: string;
  label: string;
  graceDaysText: string;
  archived: string;
  discount: string;
  channel: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    graceDaysText: string,
    archived: string,
    discount: string,
    channel: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.graceDaysText = graceDaysText;
    this.archived = archived;
    this.discount = discount;
    this.channel = channel;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toStrictConversionSnapshotView(item: StrictConversionSnapshot): StrictConversionSnapshotView {
  return new StrictConversionSnapshotView(
    item.code,
    text.truncate(item.label, 120),
    String(item.graceDays),
    `${item.archived}`,
    item.discount.toFixed(2),
    item.channel,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictConversionSnapshotViews(items: StrictConversionSnapshot[]): StrictConversionSnapshotView[] {
  const views: StrictConversionSnapshotView[] = [];
  for (const item of items) {
    views.push(toStrictConversionSnapshotView(item));
  }
  return views;
}

export function sumStrictConversionSnapshotView(view: StrictConversionSnapshotView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedGraceDays + parsedDiscount + parsedBudget;
}
