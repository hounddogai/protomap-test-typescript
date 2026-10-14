import * as text from "../../../../kit/text.js";
import { TieredBounceSummary } from "./tiered-bounce-summary.js";

/** How screens and exports show a tiered bounce summary. */
export class TieredBounceSummaryView {
  codeText: string;
  name: string;
  minimum: string;
  floorValueText: string;
  campaignRef: string;
  contactEmail: string;
  amount: string;
  channel: string;
  expiresAt: string;
  attempts: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    minimum: string,
    floorValueText: string,
    campaignRef: string,
    contactEmail: string,
    amount: string,
    channel: string,
    expiresAt: string,
    attempts: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.minimum = minimum;
    this.floorValueText = floorValueText;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBounceSummaryView(item: TieredBounceSummary): TieredBounceSummaryView {
  return new TieredBounceSummaryView(
    item.code,
    item.name,
    item.minimum.toFixed(2),
    item.floorValue.toFixed(2),
    text.truncate(item.campaignRef, 120),
    item.contactEmail,
    item.amount.toFixed(2),
    item.channel,
    String(item.expiresAt),
    String(item.attempts),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBounceSummaryViews(items: TieredBounceSummary[]): TieredBounceSummaryView[] {
  const views: TieredBounceSummaryView[] = [];
  for (const item of items) {
    views.push(toTieredBounceSummaryView(item));
  }
  return views;
}

export function sumTieredBounceSummaryView(view: TieredBounceSummaryView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedMinimum + parsedFloorValue + parsedAmount;
}
