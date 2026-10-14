import * as text from "../../../../kit/text.js";
import { CreativePlan } from "./creative-plan.js";

/** How screens and exports show a creative plan. */
export class CreativePlanView {
  codeText: string;
  title: string;
  campaignRefText: string;
  version: string;
  bid: string;
  rate: string;
  windowDays: string;
  expiresAt: string;
  startsAt: string;
  notes: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    campaignRefText: string,
    version: string,
    bid: string,
    rate: string,
    windowDays: string,
    expiresAt: string,
    startsAt: string,
    notes: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.campaignRefText = campaignRefText;
    this.version = version;
    this.bid = bid;
    this.rate = rate;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.startsAt = startsAt;
    this.notes = notes;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toCreativePlanView(item: CreativePlan): CreativePlanView {
  return new CreativePlanView(
    item.code,
    item.title,
    text.truncate(item.campaignRef, 40),
    String(item.version),
    item.bid.toFixed(2),
    item.rate.toFixed(2),
    String(item.windowDays),
    String(item.expiresAt),
    String(item.startsAt),
    item.notes,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativePlanViews(items: CreativePlan[]): CreativePlanView[] {
  const views: CreativePlanView[] = [];
  for (const item of items) {
    views.push(toCreativePlanView(item));
  }
  return views;
}

export function sumCreativePlanView(view: CreativePlanView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedVersion + parsedBid + parsedRate;
}
