import { LevelSchedule } from "./level-schedule.js";

/** How screens and exports show a level schedule. */
export class LevelScheduleView {
  code: string;
  nameText: string;
  createdAt: string;
  discount: string;
  label: string;
  country: string;
  approved: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    createdAt: string,
    discount: string,
    label: string,
    country: string,
    approved: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.createdAt = createdAt;
    this.discount = discount;
    this.label = label;
    this.country = country;
    this.approved = approved;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toLevelScheduleView(item: LevelSchedule): LevelScheduleView {
  return new LevelScheduleView(
    item.code,
    item.name,
    String(item.createdAt),
    item.discount.toFixed(2),
    item.label,
    item.country,
    `${item.approved}`,
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelScheduleViews(items: LevelSchedule[]): LevelScheduleView[] {
  const views: LevelScheduleView[] = [];
  for (const item of items) {
    views.push(toLevelScheduleView(item));
  }
  return views;
}

export function sumLevelScheduleView(view: LevelScheduleView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedCreatedAt + parsedDiscount;
}
