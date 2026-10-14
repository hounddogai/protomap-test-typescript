import * as text from "../../../../kit/text.js";
import { GlobalFraudCheckProfile } from "./global-fraud-check-profile.js";

/** How screens and exports show a global fraud check profile. */
export class GlobalFraudCheckProfileView {
  code: string;
  labelText: string;
  sendAtText: string;
  clicks: string;
  bid: string;
  retries: string;
  summary: string;
  active: string;
  weightText: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sendAtText: string,
    clicks: string,
    bid: string,
    retries: string,
    summary: string,
    active: string,
    weightText: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sendAtText = sendAtText;
    this.clicks = clicks;
    this.bid = bid;
    this.retries = retries;
    this.summary = summary;
    this.active = active;
    this.weightText = weightText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFraudCheckProfileView(item: GlobalFraudCheckProfile): GlobalFraudCheckProfileView {
  return new GlobalFraudCheckProfileView(
    item.code,
    text.truncate(item.label, 64),
    String(item.sendAt),
    String(item.clicks),
    item.bid.toFixed(2),
    String(item.retries),
    item.summary,
    `${item.active}`,
    item.weight.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFraudCheckProfileViews(items: GlobalFraudCheckProfile[]): GlobalFraudCheckProfileView[] {
  const views: GlobalFraudCheckProfileView[] = [];
  for (const item of items) {
    views.push(toGlobalFraudCheckProfileView(item));
  }
  return views;
}

export function sumGlobalFraudCheckProfileView(view: GlobalFraudCheckProfileView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedSendAt + parsedClicks + parsedBid;
}
