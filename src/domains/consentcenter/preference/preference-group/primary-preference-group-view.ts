import * as text from "../../../../kit/text.js";
import { PrimaryPreferenceGroup } from "./primary-preference-group.js";

/** How screens and exports show a primary preference group. */
export class PrimaryPreferenceGroupView {
  code: string;
  title: string;
  limit: string;
  discount: string;
  timezone: string;
  statusLabel: string;

  constructor(code: string, title: string, limit: string, discount: string, timezone: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.discount = discount;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPreferenceGroupView(item: PrimaryPreferenceGroup): PrimaryPreferenceGroupView {
  return new PrimaryPreferenceGroupView(
    text.truncate(item.code, 80),
    item.title,
    String(item.limit),
    item.discount.toFixed(2),
    text.truncate(item.timezone, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPreferenceGroupViews(items: PrimaryPreferenceGroup[]): PrimaryPreferenceGroupView[] {
  const views: PrimaryPreferenceGroupView[] = [];
  for (const item of items) {
    views.push(toPrimaryPreferenceGroupView(item));
  }
  return views;
}

export function sumPrimaryPreferenceGroupView(view: PrimaryPreferenceGroupView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedLimit + parsedDiscount;
}
