import * as text from "../../../../kit/text.js";
import { ConversionManifest } from "./conversion-manifest.js";

/** How screens and exports show a conversion manifest. */
export class ConversionManifestView {
  codeText: string;
  title: string;
  rate: string;
  campaignRef: string;
  segment: string;
  sequenceText: string;
  reviewerText: string;
  impressions: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    rate: string,
    campaignRef: string,
    segment: string,
    sequenceText: string,
    reviewerText: string,
    impressions: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.sequenceText = sequenceText;
    this.reviewerText = reviewerText;
    this.impressions = impressions;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toConversionManifestView(item: ConversionManifest): ConversionManifestView {
  return new ConversionManifestView(
    item.code,
    item.title,
    item.rate.toFixed(2),
    item.campaignRef,
    text.truncate(item.segment, 64),
    String(item.sequence),
    item.reviewer,
    String(item.impressions),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionManifestViews(items: ConversionManifest[]): ConversionManifestView[] {
  const views: ConversionManifestView[] = [];
  for (const item of items) {
    views.push(toConversionManifestView(item));
  }
  return views;
}

export function sumConversionManifestView(view: ConversionManifestView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedRate + parsedSequence + parsedImpressions;
}
