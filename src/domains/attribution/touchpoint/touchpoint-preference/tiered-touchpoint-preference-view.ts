import * as text from "../../../../kit/text.js";
import { TieredTouchpointPreference } from "./tiered-touchpoint-preference.js";

/** How screens and exports show a tiered touchpoint preference. */
export class TieredTouchpointPreferenceView {
  code: string;
  nameText: string;
  score: string;
  costText: string;
  utmSource: string;
  country: string;
  quantity: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    score: string,
    costText: string,
    utmSource: string,
    country: string,
    quantity: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.score = score;
    this.costText = costText;
    this.utmSource = utmSource;
    this.country = country;
    this.quantity = quantity;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTouchpointPreferenceView(item: TieredTouchpointPreference): TieredTouchpointPreferenceView {
  return new TieredTouchpointPreferenceView(
    text.truncate(item.code, 120),
    item.name,
    item.score.toFixed(2),
    item.cost.toFixed(2),
    item.utmSource,
    text.truncate(item.country, 120),
    String(item.quantity),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTouchpointPreferenceViews(items: TieredTouchpointPreference[]): TieredTouchpointPreferenceView[] {
  const views: TieredTouchpointPreferenceView[] = [];
  for (const item of items) {
    views.push(toTieredTouchpointPreferenceView(item));
  }
  return views;
}

export function sumTieredTouchpointPreferenceView(view: TieredTouchpointPreferenceView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedScore + parsedCost + parsedQuantity;
}
