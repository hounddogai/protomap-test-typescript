import * as text from "../../../../kit/text.js";
import { RegionalWarmupVariance } from "./regional-warmup-variance.js";

/** How screens and exports show a regional warmup variance. */
export class RegionalWarmupVarianceView {
  code: string;
  title: string;
  endsAt: string;
  phone: string;
  notes: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAt: string,
    phone: string,
    notes: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.phone = phone;
    this.notes = notes;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalWarmupVarianceView(item: RegionalWarmupVariance): RegionalWarmupVarianceView {
  return new RegionalWarmupVarianceView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    String(item.endsAt),
    item.phone,
    text.truncate(item.notes, 80),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalWarmupVarianceViews(items: RegionalWarmupVariance[]): RegionalWarmupVarianceView[] {
  const views: RegionalWarmupVarianceView[] = [];
  for (const item of items) {
    views.push(toRegionalWarmupVarianceView(item));
  }
  return views;
}

export function sumRegionalWarmupVarianceView(view: RegionalWarmupVarianceView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedEndsAt + parsedGraceDays;
}
