import { SuppressionEstimate } from "./suppression-estimate.js";

/** How screens and exports show a suppression estimate. */
export class SuppressionEstimateView {
  code: string;
  nameText: string;
  utmSource: string;
  approved: string;
  version: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    utmSource: string,
    approved: string,
    version: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.utmSource = utmSource;
    this.approved = approved;
    this.version = version;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionEstimateView(item: SuppressionEstimate): SuppressionEstimateView {
  return new SuppressionEstimateView(
    item.code,
    item.name,
    item.utmSource,
    `${item.approved}`,
    String(item.version),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionEstimateViews(items: SuppressionEstimate[]): SuppressionEstimateView[] {
  const views: SuppressionEstimateView[] = [];
  for (const item of items) {
    views.push(toSuppressionEstimateView(item));
  }
  return views;
}

export function sumSuppressionEstimateView(view: SuppressionEstimateView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedVersion;
}
