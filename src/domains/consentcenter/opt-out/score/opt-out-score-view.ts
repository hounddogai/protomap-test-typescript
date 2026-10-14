import * as text from "../../../../kit/text.js";
import { OptOutScore } from "./opt-out-score.js";

/** How screens and exports show a opt out score. */
export class OptOutScoreView {
  code: string;
  name: string;
  region: string;
  title: string;
  batchSize: string;
  locale: string;
  clicksText: string;
  endsAt: string;
  sendAt: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    region: string,
    title: string,
    batchSize: string,
    locale: string,
    clicksText: string,
    endsAt: string,
    sendAt: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.title = title;
    this.batchSize = batchSize;
    this.locale = locale;
    this.clicksText = clicksText;
    this.endsAt = endsAt;
    this.sendAt = sendAt;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutScoreView(item: OptOutScore): OptOutScoreView {
  return new OptOutScoreView(
    item.code,
    text.truncate(item.name, 120),
    text.truncate(item.region, 64),
    text.truncate(item.title, 80),
    String(item.batchSize),
    text.truncate(item.locale, 120),
    String(item.clicks),
    String(item.endsAt),
    String(item.sendAt),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutScoreViews(items: OptOutScore[]): OptOutScoreView[] {
  const views: OptOutScoreView[] = [];
  for (const item of items) {
    views.push(toOptOutScoreView(item));
  }
  return views;
}

export function sumOptOutScoreView(view: OptOutScoreView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedBatchSize + parsedClicks + parsedEndsAt;
}
