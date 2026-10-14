import * as text from "../../../../kit/text.js";
import { StrictApprovalRollup } from "./strict-approval-rollup.js";

/** How screens and exports show a strict approval rollup. */
export class StrictApprovalRollupView {
  codeText: string;
  titleText: string;
  rateText: string;
  category: string;
  source: string;
  unit: string;
  durationMinutesText: string;
  margin: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    rateText: string,
    category: string,
    source: string,
    unit: string,
    durationMinutesText: string,
    margin: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.rateText = rateText;
    this.category = category;
    this.source = source;
    this.unit = unit;
    this.durationMinutesText = durationMinutesText;
    this.margin = margin;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toStrictApprovalRollupView(item: StrictApprovalRollup): StrictApprovalRollupView {
  return new StrictApprovalRollupView(
    text.truncate(item.code, 80),
    item.title,
    item.rate.toFixed(2),
    item.category,
    item.source,
    text.truncate(item.unit, 64),
    String(item.durationMinutes),
    item.margin.toFixed(2),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictApprovalRollupViews(items: StrictApprovalRollup[]): StrictApprovalRollupView[] {
  const views: StrictApprovalRollupView[] = [];
  for (const item of items) {
    views.push(toStrictApprovalRollupView(item));
  }
  return views;
}

export function sumStrictApprovalRollupView(view: StrictApprovalRollupView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRate + parsedDurationMinutes + parsedMargin;
}
