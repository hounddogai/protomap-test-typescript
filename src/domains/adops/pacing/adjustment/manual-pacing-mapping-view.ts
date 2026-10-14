import * as text from "../../../../kit/text.js";
import { ManualPacingMapping } from "./manual-pacing-mapping.js";

/** How screens and exports show a manual pacing mapping. */
export class ManualPacingMappingView {
  codeText: string;
  label: string;
  quantity: string;
  name: string;
  reviewer: string;
  bid: string;
  approvedText: string;
  impressionsText: string;
  country: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    quantity: string,
    name: string,
    reviewer: string,
    bid: string,
    approvedText: string,
    impressionsText: string,
    country: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.quantity = quantity;
    this.name = name;
    this.reviewer = reviewer;
    this.bid = bid;
    this.approvedText = approvedText;
    this.impressionsText = impressionsText;
    this.country = country;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toManualPacingMappingView(item: ManualPacingMapping): ManualPacingMappingView {
  return new ManualPacingMappingView(
    item.code,
    text.truncate(item.label, 120),
    String(item.quantity),
    item.name,
    item.reviewer,
    item.bid.toFixed(2),
    `${item.approved}`,
    String(item.impressions),
    text.truncate(item.country, 120),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPacingMappingViews(items: ManualPacingMapping[]): ManualPacingMappingView[] {
  const views: ManualPacingMappingView[] = [];
  for (const item of items) {
    views.push(toManualPacingMappingView(item));
  }
  return views;
}

export function sumManualPacingMappingView(view: ManualPacingMappingView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedQuantity + parsedBid + parsedImpressions;
}
