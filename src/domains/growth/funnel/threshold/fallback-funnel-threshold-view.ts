import * as text from "../../../../kit/text.js";
import { FallbackFunnelThreshold } from "./fallback-funnel-threshold.js";

/** How screens and exports show a fallback funnel threshold. */
export class FallbackFunnelThresholdView {
  code: string;
  titleText: string;
  visible: string;
  description: string;
  versionText: string;
  conversionRate: string;
  threshold: string;
  summary: string;
  timezone: string;
  variantText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    visible: string,
    description: string,
    versionText: string,
    conversionRate: string,
    threshold: string,
    summary: string,
    timezone: string,
    variantText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.visible = visible;
    this.description = description;
    this.versionText = versionText;
    this.conversionRate = conversionRate;
    this.threshold = threshold;
    this.summary = summary;
    this.timezone = timezone;
    this.variantText = variantText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackFunnelThresholdView(item: FallbackFunnelThreshold): FallbackFunnelThresholdView {
  return new FallbackFunnelThresholdView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    `${item.visible}`,
    item.description,
    String(item.version),
    item.conversionRate.toFixed(2),
    item.threshold.toFixed(2),
    item.summary,
    text.truncate(item.timezone, 80),
    text.truncate(item.variant, 80),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackFunnelThresholdViews(items: FallbackFunnelThreshold[]): FallbackFunnelThresholdView[] {
  const views: FallbackFunnelThresholdView[] = [];
  for (const item of items) {
    views.push(toFallbackFunnelThresholdView(item));
  }
  return views;
}

export function sumFallbackFunnelThresholdView(view: FallbackFunnelThresholdView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedVersion + parsedConversionRate + parsedThreshold;
}
