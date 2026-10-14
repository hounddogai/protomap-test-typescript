import * as text from "../../../../kit/text.js";
import { RegionalReputationEntry } from "./regional-reputation-entry.js";

/** How screens and exports show a regional reputation entry. */
export class RegionalReputationEntryView {
  code: string;
  label: string;
  archived: string;
  category: string;
  impressionsText: string;
  bid: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    category: string,
    impressionsText: string,
    bid: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.category = category;
    this.impressionsText = impressionsText;
    this.bid = bid;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalReputationEntryView(item: RegionalReputationEntry): RegionalReputationEntryView {
  return new RegionalReputationEntryView(
    item.code,
    item.label,
    `${item.archived}`,
    item.category,
    String(item.impressions),
    item.bid.toFixed(2),
    text.truncate(item.ownerId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalReputationEntryViews(items: RegionalReputationEntry[]): RegionalReputationEntryView[] {
  const views: RegionalReputationEntryView[] = [];
  for (const item of items) {
    views.push(toRegionalReputationEntryView(item));
  }
  return views;
}

export function sumRegionalReputationEntryView(view: RegionalReputationEntryView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedImpressions + parsedBid;
}
