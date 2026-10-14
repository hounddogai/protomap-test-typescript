import * as text from "../../../../kit/text.js";
import { TieredDoubleOptInQuota } from "./tiered-double-opt-in-quota.js";

/** How screens and exports show a tiered double opt in quota. */
export class TieredDoubleOptInQuotaView {
  code: string;
  nameText: string;
  source: string;
  archived: string;
  threshold: string;
  retries: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    source: string,
    archived: string,
    threshold: string,
    retries: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.source = source;
    this.archived = archived;
    this.threshold = threshold;
    this.retries = retries;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDoubleOptInQuotaView(item: TieredDoubleOptInQuota): TieredDoubleOptInQuotaView {
  return new TieredDoubleOptInQuotaView(
    text.truncate(item.code, 40),
    item.name,
    item.source,
    `${item.archived}`,
    item.threshold.toFixed(2),
    String(item.retries),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDoubleOptInQuotaViews(items: TieredDoubleOptInQuota[]): TieredDoubleOptInQuotaView[] {
  const views: TieredDoubleOptInQuotaView[] = [];
  for (const item of items) {
    views.push(toTieredDoubleOptInQuotaView(item));
  }
  return views;
}

export function sumTieredDoubleOptInQuotaView(view: TieredDoubleOptInQuotaView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedThreshold + parsedRetries;
}
