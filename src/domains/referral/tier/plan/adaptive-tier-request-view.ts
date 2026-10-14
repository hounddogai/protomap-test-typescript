import * as text from "../../../../kit/text.js";
import { AdaptiveTierRequest } from "./adaptive-tier-request.js";

/** How screens and exports show a adaptive tier request. */
export class AdaptiveTierRequestView {
  code: string;
  title: string;
  threshold: string;
  utmSource: string;
  updatedAt: string;
  phoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    threshold: string,
    utmSource: string,
    updatedAt: string,
    phoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
    this.phoneText = phoneText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveTierRequestView(item: AdaptiveTierRequest): AdaptiveTierRequestView {
  return new AdaptiveTierRequestView(
    item.code,
    text.truncate(item.title, 80),
    item.threshold.toFixed(2),
    item.utmSource,
    String(item.updatedAt),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveTierRequestViews(items: AdaptiveTierRequest[]): AdaptiveTierRequestView[] {
  const views: AdaptiveTierRequestView[] = [];
  for (const item of items) {
    views.push(toAdaptiveTierRequestView(item));
  }
  return views;
}

export function sumAdaptiveTierRequestView(view: AdaptiveTierRequestView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedThreshold + parsedUpdatedAt;
}
