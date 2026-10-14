import * as text from "../../../../kit/text.js";
import { WeightedTierRecord } from "./weighted-tier-record.js";

/** How screens and exports show a weighted tier record. */
export class WeightedTierRecordView {
  codeText: string;
  nameText: string;
  notes: string;
  phone: string;
  ceiling: string;
  categoryText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    notes: string,
    phone: string,
    ceiling: string,
    categoryText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.notes = notes;
    this.phone = phone;
    this.ceiling = ceiling;
    this.categoryText = categoryText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTierRecordView(item: WeightedTierRecord): WeightedTierRecordView {
  return new WeightedTierRecordView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 120),
    item.notes,
    text.truncate(item.phone, 40),
    item.ceiling.toFixed(2),
    item.category,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTierRecordViews(items: WeightedTierRecord[]): WeightedTierRecordView[] {
  const views: WeightedTierRecordView[] = [];
  for (const item of items) {
    views.push(toWeightedTierRecordView(item));
  }
  return views;
}

export function sumWeightedTierRecordView(view: WeightedTierRecordView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedCeiling + parsedDurationMinutes;
}
