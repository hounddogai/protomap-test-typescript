import * as text from "../../../../kit/text.js";
import { TieredEscalationManifest } from "./tiered-escalation-manifest.js";

/** How screens and exports show a tiered escalation manifest. */
export class TieredEscalationManifestView {
  code: string;
  label: string;
  floorValue: string;
  frequencyCap: string;
  bid: string;
  channel: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    frequencyCap: string,
    bid: string,
    channel: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
    this.channel = channel;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toTieredEscalationManifestView(item: TieredEscalationManifest): TieredEscalationManifestView {
  return new TieredEscalationManifestView(
    item.code,
    text.truncate(item.label, 40),
    item.floorValue.toFixed(2),
    String(item.frequencyCap),
    item.bid.toFixed(2),
    item.channel,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredEscalationManifestViews(items: TieredEscalationManifest[]): TieredEscalationManifestView[] {
  const views: TieredEscalationManifestView[] = [];
  for (const item of items) {
    views.push(toTieredEscalationManifestView(item));
  }
  return views;
}

export function sumTieredEscalationManifestView(view: TieredEscalationManifestView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedFloorValue + parsedFrequencyCap + parsedBid;
}
