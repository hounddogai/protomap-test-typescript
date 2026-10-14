import * as text from "../../../../kit/text.js";
import { MentionForecast } from "./mention-forecast.js";

/** How screens and exports show a mention forecast. */
export class MentionForecastView {
  code: string;
  name: string;
  phone: string;
  rateText: string;
  audienceId: string;
  summary: string;
  ceilingText: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    rateText: string,
    audienceId: string,
    summary: string,
    ceilingText: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.rateText = rateText;
    this.audienceId = audienceId;
    this.summary = summary;
    this.ceilingText = ceilingText;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionForecastView(item: MentionForecast): MentionForecastView {
  return new MentionForecastView(
    item.code,
    item.name,
    item.phone,
    item.rate.toFixed(2),
    text.truncate(item.audienceId, 80),
    item.summary,
    item.ceiling.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionForecastViews(items: MentionForecast[]): MentionForecastView[] {
  const views: MentionForecastView[] = [];
  for (const item of items) {
    views.push(toMentionForecastView(item));
  }
  return views;
}

export function sumMentionForecastView(view: MentionForecastView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedRate + parsedCeiling + parsedLimit;
}
