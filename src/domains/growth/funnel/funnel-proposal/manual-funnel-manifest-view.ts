import * as text from "../../../../kit/text.js";
import { ManualFunnelManifest } from "./manual-funnel-manifest.js";

/** How screens and exports show a manual funnel manifest. */
export class ManualFunnelManifestView {
  code: string;
  name: string;
  limit: string;
  openRate: string;
  campaignRef: string;
  createdAt: string;
  capacityText: string;
  categoryText: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limit: string,
    openRate: string,
    campaignRef: string,
    createdAt: string,
    capacityText: string,
    categoryText: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.capacityText = capacityText;
    this.categoryText = categoryText;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toManualFunnelManifestView(item: ManualFunnelManifest): ManualFunnelManifestView {
  return new ManualFunnelManifestView(
    item.code,
    item.name,
    String(item.limit),
    item.openRate.toFixed(2),
    text.truncate(item.campaignRef, 80),
    String(item.createdAt),
    String(item.capacity),
    item.category,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualFunnelManifestViews(items: ManualFunnelManifest[]): ManualFunnelManifestView[] {
  const views: ManualFunnelManifestView[] = [];
  for (const item of items) {
    views.push(toManualFunnelManifestView(item));
  }
  return views;
}

export function sumManualFunnelManifestView(view: ManualFunnelManifestView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedLimit + parsedOpenRate + parsedCreatedAt;
}
