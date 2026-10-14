import * as text from "../../../../kit/text.js";
import { AdaptiveFrequencyManifest } from "./adaptive-frequency-manifest.js";

/** How screens and exports show a adaptive frequency manifest. */
export class AdaptiveFrequencyManifestView {
  codeText: string;
  label: string;
  approved: string;
  thresholdText: string;
  maximum: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    approved: string,
    thresholdText: string,
    maximum: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.approved = approved;
    this.thresholdText = thresholdText;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveFrequencyManifestView(item: AdaptiveFrequencyManifest): AdaptiveFrequencyManifestView {
  return new AdaptiveFrequencyManifestView(
    item.code,
    text.truncate(item.label, 64),
    `${item.approved}`,
    item.threshold.toFixed(2),
    item.maximum.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveFrequencyManifestViews(items: AdaptiveFrequencyManifest[]): AdaptiveFrequencyManifestView[] {
  const views: AdaptiveFrequencyManifestView[] = [];
  for (const item of items) {
    views.push(toAdaptiveFrequencyManifestView(item));
  }
  return views;
}

export function sumAdaptiveFrequencyManifestView(view: AdaptiveFrequencyManifestView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedThreshold + parsedMaximum + parsedCreatedAt;
}
