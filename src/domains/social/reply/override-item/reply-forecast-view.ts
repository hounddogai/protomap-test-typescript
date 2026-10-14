import * as text from "../../../../kit/text.js";
import { ReplyForecast } from "./reply-forecast.js";

/** How screens and exports show a reply forecast. */
export class ReplyForecastView {
  code: string;
  label: string;
  openRate: string;
  floorValueText: string;
  name: string;
  attempts: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    openRate: string,
    floorValueText: string,
    name: string,
    attempts: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.floorValueText = floorValueText;
    this.name = name;
    this.attempts = attempts;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyForecastView(item: ReplyForecast): ReplyForecastView {
  return new ReplyForecastView(
    item.code,
    text.truncate(item.label, 40),
    item.openRate.toFixed(2),
    item.floorValue.toFixed(2),
    item.name,
    String(item.attempts),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyForecastViews(items: ReplyForecast[]): ReplyForecastView[] {
  const views: ReplyForecastView[] = [];
  for (const item of items) {
    views.push(toReplyForecastView(item));
  }
  return views;
}

export function sumReplyForecastView(view: ReplyForecastView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedOpenRate + parsedFloorValue + parsedAttempts;
}
