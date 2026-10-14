import * as text from "../../../../kit/text.js";
import { TieredFraudCheckPreference } from "./tiered-fraud-check-preference.js";

/** How screens and exports show a tiered fraud check preference. */
export class TieredFraudCheckPreferenceView {
  code: string;
  name: string;
  sendAt: string;
  country: string;
  journeyId: string;
  amount: string;
  channel: string;
  limit: string;
  labelText: string;
  endsAtText: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sendAt: string,
    country: string,
    journeyId: string,
    amount: string,
    channel: string,
    limit: string,
    labelText: string,
    endsAtText: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.country = country;
    this.journeyId = journeyId;
    this.amount = amount;
    this.channel = channel;
    this.limit = limit;
    this.labelText = labelText;
    this.endsAtText = endsAtText;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFraudCheckPreferenceView(item: TieredFraudCheckPreference): TieredFraudCheckPreferenceView {
  return new TieredFraudCheckPreferenceView(
    item.code,
    text.truncate(item.name, 40),
    String(item.sendAt),
    item.country,
    item.journeyId,
    item.amount.toFixed(2),
    text.truncate(item.channel, 40),
    String(item.limit),
    item.label,
    String(item.endsAt),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFraudCheckPreferenceViews(items: TieredFraudCheckPreference[]): TieredFraudCheckPreferenceView[] {
  const views: TieredFraudCheckPreferenceView[] = [];
  for (const item of items) {
    views.push(toTieredFraudCheckPreferenceView(item));
  }
  return views;
}

export function sumTieredFraudCheckPreferenceView(view: TieredFraudCheckPreferenceView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedSendAt + parsedAmount + parsedLimit;
}
