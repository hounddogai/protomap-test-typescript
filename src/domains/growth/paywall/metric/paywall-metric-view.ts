import * as text from "../../../../kit/text.js";
import { PaywallMetric } from "./paywall-metric.js";

/** How screens and exports show a paywall metric. */
export class PaywallMetricView {
  codeText: string;
  label: string;
  attemptsText: string;
  channel: string;
  updatedAt: string;
  conversionRateText: string;
  title: string;
  externalRef: string;
  segment: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    attemptsText: string,
    channel: string,
    updatedAt: string,
    conversionRateText: string,
    title: string,
    externalRef: string,
    segment: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.attemptsText = attemptsText;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.conversionRateText = conversionRateText;
    this.title = title;
    this.externalRef = externalRef;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallMetricView(item: PaywallMetric): PaywallMetricView {
  return new PaywallMetricView(
    item.code,
    item.label,
    String(item.attempts),
    item.channel,
    String(item.updatedAt),
    item.conversionRate.toFixed(2),
    text.truncate(item.title, 64),
    item.externalRef,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallMetricViews(items: PaywallMetric[]): PaywallMetricView[] {
  const views: PaywallMetricView[] = [];
  for (const item of items) {
    views.push(toPaywallMetricView(item));
  }
  return views;
}

export function sumPaywallMetricView(view: PaywallMetricView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedAttempts + parsedUpdatedAt + parsedConversionRate;
}
