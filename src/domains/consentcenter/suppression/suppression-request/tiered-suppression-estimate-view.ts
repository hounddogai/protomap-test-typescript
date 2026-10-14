import * as text from "../../../../kit/text.js";
import { TieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

/** How screens and exports show a tiered suppression estimate. */
export class TieredSuppressionEstimateView {
  codeText: string;
  name: string;
  score: string;
  country: string;
  phone: string;
  capacityText: string;
  sendAt: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    score: string,
    country: string,
    phone: string,
    capacityText: string,
    sendAt: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.score = score;
    this.country = country;
    this.phone = phone;
    this.capacityText = capacityText;
    this.sendAt = sendAt;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSuppressionEstimateView(item: TieredSuppressionEstimate): TieredSuppressionEstimateView {
  return new TieredSuppressionEstimateView(
    item.code,
    text.truncate(item.name, 80),
    item.score.toFixed(2),
    item.country,
    item.phone,
    String(item.capacity),
    String(item.sendAt),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSuppressionEstimateViews(items: TieredSuppressionEstimate[]): TieredSuppressionEstimateView[] {
  const views: TieredSuppressionEstimateView[] = [];
  for (const item of items) {
    views.push(toTieredSuppressionEstimateView(item));
  }
  return views;
}

export function sumTieredSuppressionEstimateView(view: TieredSuppressionEstimateView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedScore + parsedCapacity + parsedSendAt;
}
