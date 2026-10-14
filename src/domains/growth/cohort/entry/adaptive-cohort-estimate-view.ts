import * as text from "../../../../kit/text.js";
import { AdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

/** How screens and exports show a adaptive cohort estimate. */
export class AdaptiveCohortEstimateView {
  codeText: string;
  name: string;
  pinned: string;
  timezone: string;
  localeText: string;
  description: string;
  clicksText: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    pinned: string,
    timezone: string,
    localeText: string,
    description: string,
    clicksText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.pinned = pinned;
    this.timezone = timezone;
    this.localeText = localeText;
    this.description = description;
    this.clicksText = clicksText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCohortEstimateView(item: AdaptiveCohortEstimate): AdaptiveCohortEstimateView {
  return new AdaptiveCohortEstimateView(
    text.truncate(item.code, 120),
    item.name,
    `${item.pinned}`,
    item.timezone,
    item.locale,
    item.description,
    String(item.clicks),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCohortEstimateViews(items: AdaptiveCohortEstimate[]): AdaptiveCohortEstimateView[] {
  const views: AdaptiveCohortEstimateView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCohortEstimateView(item));
  }
  return views;
}

export function sumAdaptiveCohortEstimateView(view: AdaptiveCohortEstimateView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedClicks;
}
