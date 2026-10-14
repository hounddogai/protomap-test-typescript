import { JourneyThreshold } from "./journey-threshold.js";

/** How screens and exports show a journey threshold. */
export class JourneyThresholdView {
  code: string;
  label: string;
  endsAt: string;
  timezone: string;
  name: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    endsAt: string,
    timezone: string,
    name: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.name = name;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyThresholdView(item: JourneyThreshold): JourneyThresholdView {
  return new JourneyThresholdView(
    item.code,
    item.label,
    String(item.endsAt),
    item.timezone,
    item.name,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyThresholdViews(items: JourneyThreshold[]): JourneyThresholdView[] {
  const views: JourneyThresholdView[] = [];
  for (const item of items) {
    views.push(toJourneyThresholdView(item));
  }
  return views;
}

export function sumJourneyThresholdView(view: JourneyThresholdView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedEndsAt + parsedConversionRate;
}
