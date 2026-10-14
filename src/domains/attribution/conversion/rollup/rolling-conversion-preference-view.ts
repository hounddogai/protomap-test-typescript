import * as text from "../../../../kit/text.js";
import { RollingConversionPreference } from "./rolling-conversion-preference.js";

/** How screens and exports show a rolling conversion preference. */
export class RollingConversionPreferenceView {
  code: string;
  label: string;
  thresholdText: string;
  region: string;
  expiresAt: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    thresholdText: string,
    region: string,
    expiresAt: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.thresholdText = thresholdText;
    this.region = region;
    this.expiresAt = expiresAt;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toRollingConversionPreferenceView(item: RollingConversionPreference): RollingConversionPreferenceView {
  return new RollingConversionPreferenceView(
    item.code,
    item.label,
    item.threshold.toFixed(2),
    item.region,
    String(item.expiresAt),
    text.truncate(item.utmSource, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingConversionPreferenceViews(items: RollingConversionPreference[]): RollingConversionPreferenceView[] {
  const views: RollingConversionPreferenceView[] = [];
  for (const item of items) {
    views.push(toRollingConversionPreferenceView(item));
  }
  return views;
}

export function sumRollingConversionPreferenceView(view: RollingConversionPreferenceView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedThreshold + parsedExpiresAt;
}
