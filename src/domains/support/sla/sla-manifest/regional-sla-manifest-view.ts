import * as text from "../../../../kit/text.js";
import { RegionalSlaManifest } from "./regional-sla-manifest.js";

/** How screens and exports show a regional sla manifest. */
export class RegionalSlaManifestView {
  codeText: string;
  label: string;
  channelText: string;
  maximum: string;
  attemptsText: string;
  reviewerText: string;
  localeText: string;
  conversionRate: string;
  updatedAt: string;
  ceilingText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    channelText: string,
    maximum: string,
    attemptsText: string,
    reviewerText: string,
    localeText: string,
    conversionRate: string,
    updatedAt: string,
    ceilingText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.channelText = channelText;
    this.maximum = maximum;
    this.attemptsText = attemptsText;
    this.reviewerText = reviewerText;
    this.localeText = localeText;
    this.conversionRate = conversionRate;
    this.updatedAt = updatedAt;
    this.ceilingText = ceilingText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSlaManifestView(item: RegionalSlaManifest): RegionalSlaManifestView {
  return new RegionalSlaManifestView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.channel, 64),
    item.maximum.toFixed(2),
    String(item.attempts),
    text.truncate(item.reviewer, 120),
    item.locale,
    item.conversionRate.toFixed(2),
    String(item.updatedAt),
    item.ceiling.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSlaManifestViews(items: RegionalSlaManifest[]): RegionalSlaManifestView[] {
  const views: RegionalSlaManifestView[] = [];
  for (const item of items) {
    views.push(toRegionalSlaManifestView(item));
  }
  return views;
}

export function sumRegionalSlaManifestView(view: RegionalSlaManifestView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedMaximum + parsedAttempts + parsedConversionRate;
}
