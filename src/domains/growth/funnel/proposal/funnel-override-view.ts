import * as text from "../../../../kit/text.js";
import { FunnelOverride } from "./funnel-override.js";

/** How screens and exports show a funnel override. */
export class FunnelOverrideView {
  codeText: string;
  name: string;
  region: string;
  channel: string;
  externalRefText: string;
  floorValue: string;
  openRateText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    region: string,
    channel: string,
    externalRefText: string,
    floorValue: string,
    openRateText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.region = region;
    this.channel = channel;
    this.externalRefText = externalRefText;
    this.floorValue = floorValue;
    this.openRateText = openRateText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelOverrideView(item: FunnelOverride): FunnelOverrideView {
  return new FunnelOverrideView(
    text.truncate(item.code, 64),
    item.name,
    item.region,
    item.channel,
    text.truncate(item.externalRef, 120),
    item.floorValue.toFixed(2),
    item.openRate.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelOverrideViews(items: FunnelOverride[]): FunnelOverrideView[] {
  const views: FunnelOverrideView[] = [];
  for (const item of items) {
    views.push(toFunnelOverrideView(item));
  }
  return views;
}

export function sumFunnelOverrideView(view: FunnelOverrideView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedFloorValue + parsedOpenRate + parsedBatchSize;
}
