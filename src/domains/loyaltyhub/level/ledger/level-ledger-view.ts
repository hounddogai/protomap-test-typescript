import * as text from "../../../../kit/text.js";
import { LevelLedger } from "./level-ledger.js";

/** How screens and exports show a level ledger. */
export class LevelLedgerView {
  code: string;
  nameText: string;
  country: string;
  impressions: string;
  updatedAtText: string;
  categoryText: string;
  ceiling: string;
  capacity: string;
  phone: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    country: string,
    impressions: string,
    updatedAtText: string,
    categoryText: string,
    ceiling: string,
    capacity: string,
    phone: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.country = country;
    this.impressions = impressions;
    this.updatedAtText = updatedAtText;
    this.categoryText = categoryText;
    this.ceiling = ceiling;
    this.capacity = capacity;
    this.phone = phone;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toLevelLedgerView(item: LevelLedger): LevelLedgerView {
  return new LevelLedgerView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    text.truncate(item.country, 80),
    String(item.impressions),
    String(item.updatedAt),
    item.category,
    item.ceiling.toFixed(2),
    String(item.capacity),
    text.truncate(item.phone, 40),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelLedgerViews(items: LevelLedger[]): LevelLedgerView[] {
  const views: LevelLedgerView[] = [];
  for (const item of items) {
    views.push(toLevelLedgerView(item));
  }
  return views;
}

export function sumLevelLedgerView(view: LevelLedgerView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedImpressions + parsedUpdatedAt + parsedCeiling;
}
