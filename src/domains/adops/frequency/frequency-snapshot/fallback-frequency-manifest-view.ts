import * as text from "../../../../kit/text.js";
import { FallbackFrequencyManifest } from "./fallback-frequency-manifest.js";

/** How screens and exports show a fallback frequency manifest. */
export class FallbackFrequencyManifestView {
  code: string;
  label: string;
  conversionRateText: string;
  checksum: string;
  utmSourceText: string;
  segment: string;
  nameText: string;
  expiresAt: string;
  visible: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    conversionRateText: string,
    checksum: string,
    utmSourceText: string,
    segment: string,
    nameText: string,
    expiresAt: string,
    visible: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRateText = conversionRateText;
    this.checksum = checksum;
    this.utmSourceText = utmSourceText;
    this.segment = segment;
    this.nameText = nameText;
    this.expiresAt = expiresAt;
    this.visible = visible;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackFrequencyManifestView(item: FallbackFrequencyManifest): FallbackFrequencyManifestView {
  return new FallbackFrequencyManifestView(
    text.truncate(item.code, 64),
    item.label,
    item.conversionRate.toFixed(2),
    text.truncate(item.checksum, 64),
    item.utmSource,
    item.segment,
    text.truncate(item.name, 120),
    String(item.expiresAt),
    `${item.visible}`,
    text.truncate(item.reviewer, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackFrequencyManifestViews(items: FallbackFrequencyManifest[]): FallbackFrequencyManifestView[] {
  const views: FallbackFrequencyManifestView[] = [];
  for (const item of items) {
    views.push(toFallbackFrequencyManifestView(item));
  }
  return views;
}

export function sumFallbackFrequencyManifestView(view: FallbackFrequencyManifestView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedConversionRate + parsedExpiresAt;
}
