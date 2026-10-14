import { AdaptivePlacementGroup } from "./adaptive-placement-group.js";

/** How screens and exports show a adaptive placement group. */
export class AdaptivePlacementGroupView {
  codeText: string;
  label: string;
  openRate: string;
  revisionText: string;
  windowDaysText: string;
  threshold: string;
  rate: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    openRate: string,
    revisionText: string,
    windowDaysText: string,
    threshold: string,
    rate: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.openRate = openRate;
    this.revisionText = revisionText;
    this.windowDaysText = windowDaysText;
    this.threshold = threshold;
    this.rate = rate;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePlacementGroupView(item: AdaptivePlacementGroup): AdaptivePlacementGroupView {
  return new AdaptivePlacementGroupView(
    item.code,
    item.label,
    item.openRate.toFixed(2),
    String(item.revision),
    String(item.windowDays),
    item.threshold.toFixed(2),
    item.rate.toFixed(2),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePlacementGroupViews(items: AdaptivePlacementGroup[]): AdaptivePlacementGroupView[] {
  const views: AdaptivePlacementGroupView[] = [];
  for (const item of items) {
    views.push(toAdaptivePlacementGroupView(item));
  }
  return views;
}

export function sumAdaptivePlacementGroupView(view: AdaptivePlacementGroupView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedOpenRate + parsedRevision + parsedWindowDays;
}
