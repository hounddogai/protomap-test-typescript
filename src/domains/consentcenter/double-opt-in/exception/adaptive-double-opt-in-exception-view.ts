import * as text from "../../../../kit/text.js";
import { AdaptiveDoubleOptInException } from "./adaptive-double-opt-in-exception.js";

/** How screens and exports show a adaptive double opt in exception. */
export class AdaptiveDoubleOptInExceptionView {
  code: string;
  nameText: string;
  variant: string;
  conversionRate: string;
  summary: string;
  label: string;
  country: string;
  version: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    variant: string,
    conversionRate: string,
    summary: string,
    label: string,
    country: string,
    version: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.variant = variant;
    this.conversionRate = conversionRate;
    this.summary = summary;
    this.label = label;
    this.country = country;
    this.version = version;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveDoubleOptInExceptionView(item: AdaptiveDoubleOptInException): AdaptiveDoubleOptInExceptionView {
  return new AdaptiveDoubleOptInExceptionView(
    item.code,
    item.name,
    text.truncate(item.variant, 40),
    item.conversionRate.toFixed(2),
    item.summary,
    item.label,
    item.country,
    String(item.version),
    text.truncate(item.timezone, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveDoubleOptInExceptionViews(items: AdaptiveDoubleOptInException[]): AdaptiveDoubleOptInExceptionView[] {
  const views: AdaptiveDoubleOptInExceptionView[] = [];
  for (const item of items) {
    views.push(toAdaptiveDoubleOptInExceptionView(item));
  }
  return views;
}

export function sumAdaptiveDoubleOptInExceptionView(view: AdaptiveDoubleOptInExceptionView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedConversionRate + parsedVersion;
}
