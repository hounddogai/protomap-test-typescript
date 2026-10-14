import * as text from "../../../../kit/text.js";
import { GlobalBranchCycle } from "./global-branch-cycle.js";

/** How screens and exports show a global branch cycle. */
export class GlobalBranchCycleView {
  code: string;
  label: string;
  utmSource: string;
  windowDaysText: string;
  durationMinutes: string;
  bid: string;
  weight: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    windowDaysText: string,
    durationMinutes: string,
    bid: string,
    weight: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.windowDaysText = windowDaysText;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
    this.weight = weight;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBranchCycleView(item: GlobalBranchCycle): GlobalBranchCycleView {
  return new GlobalBranchCycleView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 64),
    item.utmSource,
    String(item.windowDays),
    String(item.durationMinutes),
    item.bid.toFixed(2),
    item.weight.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBranchCycleViews(items: GlobalBranchCycle[]): GlobalBranchCycleView[] {
  const views: GlobalBranchCycleView[] = [];
  for (const item of items) {
    views.push(toGlobalBranchCycleView(item));
  }
  return views;
}

export function sumGlobalBranchCycleView(view: GlobalBranchCycleView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedWindowDays + parsedDurationMinutes + parsedBid;
}
