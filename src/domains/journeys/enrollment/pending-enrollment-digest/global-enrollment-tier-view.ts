import * as text from "../../../../kit/text.js";
import { GlobalEnrollmentTier } from "./global-enrollment-tier.js";

/** How screens and exports show a global enrollment tier. */
export class GlobalEnrollmentTierView {
  code: string;
  name: string;
  source: string;
  summaryText: string;
  marginText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    source: string,
    summaryText: string,
    marginText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.summaryText = summaryText;
    this.marginText = marginText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalEnrollmentTierView(item: GlobalEnrollmentTier): GlobalEnrollmentTierView {
  return new GlobalEnrollmentTierView(
    text.truncate(item.code, 80),
    item.name,
    item.source,
    item.summary,
    item.margin.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalEnrollmentTierViews(items: GlobalEnrollmentTier[]): GlobalEnrollmentTierView[] {
  const views: GlobalEnrollmentTierView[] = [];
  for (const item of items) {
    views.push(toGlobalEnrollmentTierView(item));
  }
  return views;
}

export function sumGlobalEnrollmentTierView(view: GlobalEnrollmentTierView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedMargin;
}
