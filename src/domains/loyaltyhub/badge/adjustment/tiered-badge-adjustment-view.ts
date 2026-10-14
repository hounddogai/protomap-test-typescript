import * as text from "../../../../kit/text.js";
import { TieredBadgeAdjustment } from "./tiered-badge-adjustment.js";

/** How screens and exports show a tiered badge adjustment. */
export class TieredBadgeAdjustmentView {
  codeText: string;
  name: string;
  batchSize: string;
  contactEmail: string;
  region: string;
  ceilingText: string;
  clicks: string;
  retries: string;
  channel: string;
  ownerId: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    batchSize: string,
    contactEmail: string,
    region: string,
    ceilingText: string,
    clicks: string,
    retries: string,
    channel: string,
    ownerId: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.batchSize = batchSize;
    this.contactEmail = contactEmail;
    this.region = region;
    this.ceilingText = ceilingText;
    this.clicks = clicks;
    this.retries = retries;
    this.channel = channel;
    this.ownerId = ownerId;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBadgeAdjustmentView(item: TieredBadgeAdjustment): TieredBadgeAdjustmentView {
  return new TieredBadgeAdjustmentView(
    item.code,
    item.name,
    String(item.batchSize),
    item.contactEmail,
    text.truncate(item.region, 40),
    item.ceiling.toFixed(2),
    String(item.clicks),
    String(item.retries),
    item.channel,
    item.ownerId,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBadgeAdjustmentViews(items: TieredBadgeAdjustment[]): TieredBadgeAdjustmentView[] {
  const views: TieredBadgeAdjustmentView[] = [];
  for (const item of items) {
    views.push(toTieredBadgeAdjustmentView(item));
  }
  return views;
}

export function sumTieredBadgeAdjustmentView(view: TieredBadgeAdjustmentView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedBatchSize + parsedCeiling + parsedClicks;
}
