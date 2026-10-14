import * as text from "../../../../kit/text.js";
import { RegionalModelAllocation } from "./regional-model-allocation.js";

/** How screens and exports show a regional model allocation. */
export class RegionalModelAllocationView {
  codeText: string;
  label: string;
  category: string;
  utmSource: string;
  timezoneText: string;
  pinned: string;
  descriptionText: string;
  quantity: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    category: string,
    utmSource: string,
    timezoneText: string,
    pinned: string,
    descriptionText: string,
    quantity: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.category = category;
    this.utmSource = utmSource;
    this.timezoneText = timezoneText;
    this.pinned = pinned;
    this.descriptionText = descriptionText;
    this.quantity = quantity;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalModelAllocationView(item: RegionalModelAllocation): RegionalModelAllocationView {
  return new RegionalModelAllocationView(
    item.code,
    text.truncate(item.label, 80),
    item.category,
    text.truncate(item.utmSource, 120),
    text.truncate(item.timezone, 64),
    `${item.pinned}`,
    item.description,
    String(item.quantity),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalModelAllocationViews(items: RegionalModelAllocation[]): RegionalModelAllocationView[] {
  const views: RegionalModelAllocationView[] = [];
  for (const item of items) {
    views.push(toRegionalModelAllocationView(item));
  }
  return views;
}

export function sumRegionalModelAllocationView(view: RegionalModelAllocationView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedQuantity + parsedOpenRate;
}
