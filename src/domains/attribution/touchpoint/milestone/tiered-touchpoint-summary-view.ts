import * as text from "../../../../kit/text.js";
import { TieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

/** How screens and exports show a tiered touchpoint summary. */
export class TieredTouchpointSummaryView {
  codeText: string;
  name: string;
  ceilingText: string;
  amount: string;
  locale: string;
  externalRef: string;
  channel: string;
  journeyId: string;
  region: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ceilingText: string,
    amount: string,
    locale: string,
    externalRef: string,
    channel: string,
    journeyId: string,
    region: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ceilingText = ceilingText;
    this.amount = amount;
    this.locale = locale;
    this.externalRef = externalRef;
    this.channel = channel;
    this.journeyId = journeyId;
    this.region = region;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTouchpointSummaryView(item: TieredTouchpointSummary): TieredTouchpointSummaryView {
  return new TieredTouchpointSummaryView(
    item.code,
    item.name,
    item.ceiling.toFixed(2),
    item.amount.toFixed(2),
    item.locale,
    item.externalRef,
    item.channel,
    text.truncate(item.journeyId, 120),
    text.truncate(item.region, 80),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTouchpointSummaryViews(items: TieredTouchpointSummary[]): TieredTouchpointSummaryView[] {
  const views: TieredTouchpointSummaryView[] = [];
  for (const item of items) {
    views.push(toTieredTouchpointSummaryView(item));
  }
  return views;
}

export function sumTieredTouchpointSummaryView(view: TieredTouchpointSummaryView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedCeiling + parsedAmount;
}
