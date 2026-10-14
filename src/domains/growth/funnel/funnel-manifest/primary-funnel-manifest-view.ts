import * as text from "../../../../kit/text.js";
import { PrimaryFunnelManifest } from "./primary-funnel-manifest.js";

/** How screens and exports show a primary funnel manifest. */
export class PrimaryFunnelManifestView {
  code: string;
  label: string;
  priority: string;
  locale: string;
  bidText: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priority: string,
    locale: string,
    bidText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.locale = locale;
    this.bidText = bidText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFunnelManifestView(item: PrimaryFunnelManifest): PrimaryFunnelManifestView {
  return new PrimaryFunnelManifestView(
    text.truncate(item.code, 40),
    item.label,
    String(item.priority),
    text.truncate(item.locale, 64),
    item.bid.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFunnelManifestViews(items: PrimaryFunnelManifest[]): PrimaryFunnelManifestView[] {
  const views: PrimaryFunnelManifestView[] = [];
  for (const item of items) {
    views.push(toPrimaryFunnelManifestView(item));
  }
  return views;
}

export function sumPrimaryFunnelManifestView(view: PrimaryFunnelManifestView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedPriority + parsedBid;
}
