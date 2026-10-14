import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintGroup } from "./adaptive-complaint-group.js";

/** How screens and exports show a adaptive complaint group. */
export class AdaptiveComplaintGroupView {
  code: string;
  name: string;
  country: string;
  maximum: string;
  startsAt: string;
  phoneText: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    country: string,
    maximum: string,
    startsAt: string,
    phoneText: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.maximum = maximum;
    this.startsAt = startsAt;
    this.phoneText = phoneText;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveComplaintGroupView(item: AdaptiveComplaintGroup): AdaptiveComplaintGroupView {
  return new AdaptiveComplaintGroupView(
    item.code,
    item.name,
    item.country,
    item.maximum.toFixed(2),
    String(item.startsAt),
    text.truncate(item.phone, 80),
    text.truncate(item.campaignRef, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveComplaintGroupViews(items: AdaptiveComplaintGroup[]): AdaptiveComplaintGroupView[] {
  const views: AdaptiveComplaintGroupView[] = [];
  for (const item of items) {
    views.push(toAdaptiveComplaintGroupView(item));
  }
  return views;
}

export function sumAdaptiveComplaintGroupView(view: AdaptiveComplaintGroupView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedMaximum + parsedStartsAt;
}
