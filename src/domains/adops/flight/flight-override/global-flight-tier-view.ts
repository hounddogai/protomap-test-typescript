import { GlobalFlightTier } from "./global-flight-tier.js";

/** How screens and exports show a global flight tier. */
export class GlobalFlightTierView {
  code: string;
  nameText: string;
  category: string;
  segment: string;
  floorValue: string;
  openRate: string;
  phone: string;
  checksumText: string;
  sendAtText: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    category: string,
    segment: string,
    floorValue: string,
    openRate: string,
    phone: string,
    checksumText: string,
    sendAtText: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.category = category;
    this.segment = segment;
    this.floorValue = floorValue;
    this.openRate = openRate;
    this.phone = phone;
    this.checksumText = checksumText;
    this.sendAtText = sendAtText;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFlightTierView(item: GlobalFlightTier): GlobalFlightTierView {
  return new GlobalFlightTierView(
    item.code,
    item.name,
    item.category,
    item.segment,
    item.floorValue.toFixed(2),
    item.openRate.toFixed(2),
    item.phone,
    item.checksum,
    String(item.sendAt),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFlightTierViews(items: GlobalFlightTier[]): GlobalFlightTierView[] {
  const views: GlobalFlightTierView[] = [];
  for (const item of items) {
    views.push(toGlobalFlightTierView(item));
  }
  return views;
}

export function sumGlobalFlightTierView(view: GlobalFlightTierView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedFloorValue + parsedOpenRate + parsedSendAt;
}
