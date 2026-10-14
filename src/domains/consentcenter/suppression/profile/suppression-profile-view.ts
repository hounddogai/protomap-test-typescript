import * as text from "../../../../kit/text.js";
import { SuppressionProfile } from "./suppression-profile.js";

/** How screens and exports show a suppression profile. */
export class SuppressionProfileView {
  code: string;
  title: string;
  approved: string;
  floorValue: string;
  cost: string;
  pinned: string;
  region: string;
  channelText: string;
  retriesText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    approved: string,
    floorValue: string,
    cost: string,
    pinned: string,
    region: string,
    channelText: string,
    retriesText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.floorValue = floorValue;
    this.cost = cost;
    this.pinned = pinned;
    this.region = region;
    this.channelText = channelText;
    this.retriesText = retriesText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionProfileView(item: SuppressionProfile): SuppressionProfileView {
  return new SuppressionProfileView(
    item.code,
    item.title,
    `${item.approved}`,
    item.floorValue.toFixed(2),
    item.cost.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.region, 80),
    item.channel,
    String(item.retries),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionProfileViews(items: SuppressionProfile[]): SuppressionProfileView[] {
  const views: SuppressionProfileView[] = [];
  for (const item of items) {
    views.push(toSuppressionProfileView(item));
  }
  return views;
}

export function sumSuppressionProfileView(view: SuppressionProfileView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedFloorValue + parsedCost + parsedRetries;
}
