import { WindowSchedule } from "./window-schedule.js";

/** How screens and exports show a window schedule. */
export class WindowScheduleView {
  code: string;
  label: string;
  margin: string;
  graceDays: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    margin: string,
    graceDays: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.graceDays = graceDays;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowScheduleView(item: WindowSchedule): WindowScheduleView {
  return new WindowScheduleView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    String(item.graceDays),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowScheduleViews(items: WindowSchedule[]): WindowScheduleView[] {
  const views: WindowScheduleView[] = [];
  for (const item of items) {
    views.push(toWindowScheduleView(item));
  }
  return views;
}

export function sumWindowScheduleView(view: WindowScheduleView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedMargin + parsedGraceDays + parsedBid;
}
