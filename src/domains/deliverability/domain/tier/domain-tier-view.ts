import * as text from "../../../../kit/text.js";
import { DomainTier } from "./domain-tier.js";

/** How screens and exports show a domain tier. */
export class DomainTierView {
  code: string;
  labelText: string;
  campaignRef: string;
  durationMinutesText: string;
  limit: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    campaignRef: string,
    durationMinutesText: string,
    limit: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.campaignRef = campaignRef;
    this.durationMinutesText = durationMinutesText;
    this.limit = limit;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toDomainTierView(item: DomainTier): DomainTierView {
  return new DomainTierView(
    item.code,
    item.label,
    text.truncate(item.campaignRef, 120),
    String(item.durationMinutes),
    String(item.limit),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainTierViews(items: DomainTier[]): DomainTierView[] {
  const views: DomainTierView[] = [];
  for (const item of items) {
    views.push(toDomainTierView(item));
  }
  return views;
}

export function sumDomainTierView(view: DomainTierView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedDurationMinutes + parsedLimit;
}
