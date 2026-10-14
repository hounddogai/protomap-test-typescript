import { RegionalComplaintManifest } from "./regional-complaint-manifest.js";

/** How screens and exports show a regional complaint manifest. */
export class RegionalComplaintManifestView {
  code: string;
  labelText: string;
  expiresAt: string;
  createdAt: string;
  channel: string;
  margin: string;
  budgetText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    expiresAt: string,
    createdAt: string,
    channel: string,
    margin: string,
    budgetText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.channel = channel;
    this.margin = margin;
    this.budgetText = budgetText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalComplaintManifestView(item: RegionalComplaintManifest): RegionalComplaintManifestView {
  return new RegionalComplaintManifestView(
    item.code,
    item.label,
    String(item.expiresAt),
    String(item.createdAt),
    item.channel,
    item.margin.toFixed(2),
    item.budget.toFixed(2),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalComplaintManifestViews(items: RegionalComplaintManifest[]): RegionalComplaintManifestView[] {
  const views: RegionalComplaintManifestView[] = [];
  for (const item of items) {
    views.push(toRegionalComplaintManifestView(item));
  }
  return views;
}

export function sumRegionalComplaintManifestView(view: RegionalComplaintManifestView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedExpiresAt + parsedCreatedAt + parsedMargin;
}
