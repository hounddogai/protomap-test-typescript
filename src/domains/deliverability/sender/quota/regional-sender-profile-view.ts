import * as text from "../../../../kit/text.js";
import { RegionalSenderProfile } from "./regional-sender-profile.js";

/** How screens and exports show a regional sender profile. */
export class RegionalSenderProfileView {
  code: string;
  name: string;
  currency: string;
  floorValue: string;
  journeyId: string;
  locale: string;
  clicksText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    currency: string,
    floorValue: string,
    journeyId: string,
    locale: string,
    clicksText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.floorValue = floorValue;
    this.journeyId = journeyId;
    this.locale = locale;
    this.clicksText = clicksText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSenderProfileView(item: RegionalSenderProfile): RegionalSenderProfileView {
  return new RegionalSenderProfileView(
    item.code,
    item.name,
    item.currency,
    item.floorValue.toFixed(2),
    text.truncate(item.journeyId, 80),
    item.locale,
    String(item.clicks),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSenderProfileViews(items: RegionalSenderProfile[]): RegionalSenderProfileView[] {
  const views: RegionalSenderProfileView[] = [];
  for (const item of items) {
    views.push(toRegionalSenderProfileView(item));
  }
  return views;
}

export function sumRegionalSenderProfileView(view: RegionalSenderProfileView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedFloorValue + parsedClicks + parsedQuantity;
}
