import * as text from "../../../../kit/text.js";
import { DefaultPathAdjustment } from "./default-path-adjustment.js";

/** How screens and exports show a default path adjustment. */
export class DefaultPathAdjustmentView {
  code: string;
  titleText: string;
  graceDays: string;
  startsAt: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    graceDays: string,
    startsAt: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.graceDays = graceDays;
    this.startsAt = startsAt;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPathAdjustmentView(item: DefaultPathAdjustment): DefaultPathAdjustmentView {
  return new DefaultPathAdjustmentView(
    item.code,
    item.title,
    String(item.graceDays),
    String(item.startsAt),
    text.truncate(item.phone, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPathAdjustmentViews(items: DefaultPathAdjustment[]): DefaultPathAdjustmentView[] {
  const views: DefaultPathAdjustmentView[] = [];
  for (const item of items) {
    views.push(toDefaultPathAdjustmentView(item));
  }
  return views;
}

export function sumDefaultPathAdjustmentView(view: DefaultPathAdjustmentView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedGraceDays + parsedStartsAt;
}
