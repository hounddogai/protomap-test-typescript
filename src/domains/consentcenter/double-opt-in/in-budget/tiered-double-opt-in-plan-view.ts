import * as text from "../../../../kit/text.js";
import { TieredDoubleOptInPlan } from "./tiered-double-opt-in-plan.js";

/** How screens and exports show a tiered double opt in plan. */
export class TieredDoubleOptInPlanView {
  codeText: string;
  labelText: string;
  bid: string;
  category: string;
  sendAt: string;
  version: string;
  checksumText: string;
  expiresAt: string;
  ratio: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    bid: string,
    category: string,
    sendAt: string,
    version: string,
    checksumText: string,
    expiresAt: string,
    ratio: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.bid = bid;
    this.category = category;
    this.sendAt = sendAt;
    this.version = version;
    this.checksumText = checksumText;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDoubleOptInPlanView(item: TieredDoubleOptInPlan): TieredDoubleOptInPlanView {
  return new TieredDoubleOptInPlanView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    item.bid.toFixed(2),
    text.truncate(item.category, 64),
    String(item.sendAt),
    String(item.version),
    item.checksum,
    String(item.expiresAt),
    item.ratio.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDoubleOptInPlanViews(items: TieredDoubleOptInPlan[]): TieredDoubleOptInPlanView[] {
  const views: TieredDoubleOptInPlanView[] = [];
  for (const item of items) {
    views.push(toTieredDoubleOptInPlanView(item));
  }
  return views;
}

export function sumTieredDoubleOptInPlanView(view: TieredDoubleOptInPlanView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedBid + parsedSendAt + parsedVersion;
}
