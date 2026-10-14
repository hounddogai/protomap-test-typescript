import * as text from "../../../../kit/text.js";
import { LenientMacroEntry } from "./lenient-macro-entry.js";

/** How screens and exports show a lenient macro entry. */
export class LenientMacroEntryView {
  codeText: string;
  nameText: string;
  bid: string;
  floorValue: string;
  campaignRefText: string;
  label: string;
  clicksText: string;
  impressions: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    bid: string,
    floorValue: string,
    campaignRefText: string,
    label: string,
    clicksText: string,
    impressions: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.bid = bid;
    this.floorValue = floorValue;
    this.campaignRefText = campaignRefText;
    this.label = label;
    this.clicksText = clicksText;
    this.impressions = impressions;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toLenientMacroEntryView(item: LenientMacroEntry): LenientMacroEntryView {
  return new LenientMacroEntryView(
    item.code,
    item.name,
    item.bid.toFixed(2),
    item.floorValue.toFixed(2),
    text.truncate(item.campaignRef, 80),
    item.label,
    String(item.clicks),
    String(item.impressions),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientMacroEntryViews(items: LenientMacroEntry[]): LenientMacroEntryView[] {
  const views: LenientMacroEntryView[] = [];
  for (const item of items) {
    views.push(toLenientMacroEntryView(item));
  }
  return views;
}

export function sumLenientMacroEntryView(view: LenientMacroEntryView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedBid + parsedFloorValue + parsedClicks;
}
