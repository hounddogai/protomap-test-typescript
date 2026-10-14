import * as text from "../../../../kit/text.js";
import { AdaptiveOptOutProfile } from "./adaptive-opt-out-profile.js";

/** How screens and exports show a adaptive opt out profile. */
export class AdaptiveOptOutProfileView {
  code: string;
  name: string;
  endsAt: string;
  locale: string;
  threshold: string;
  statusLabel: string;

  constructor(code: string, name: string, endsAt: string, locale: string, threshold: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.locale = locale;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveOptOutProfileView(item: AdaptiveOptOutProfile): AdaptiveOptOutProfileView {
  return new AdaptiveOptOutProfileView(
    text.truncate(item.code, 120),
    item.name,
    String(item.endsAt),
    text.truncate(item.locale, 80),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveOptOutProfileViews(items: AdaptiveOptOutProfile[]): AdaptiveOptOutProfileView[] {
  const views: AdaptiveOptOutProfileView[] = [];
  for (const item of items) {
    views.push(toAdaptiveOptOutProfileView(item));
  }
  return views;
}

export function sumAdaptiveOptOutProfileView(view: AdaptiveOptOutProfileView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedEndsAt + parsedThreshold;
}
