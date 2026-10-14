import * as text from "../../../../kit/text.js";
import { SuppressionManifest } from "./suppression-manifest.js";

/** How screens and exports show a suppression manifest. */
export class SuppressionManifestView {
  code: string;
  titleText: string;
  contactEmail: string;
  clicksText: string;
  margin: string;
  description: string;
  ratio: string;
  priorityText: string;
  externalRefText: string;
  batchSize: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    contactEmail: string,
    clicksText: string,
    margin: string,
    description: string,
    ratio: string,
    priorityText: string,
    externalRefText: string,
    batchSize: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.contactEmail = contactEmail;
    this.clicksText = clicksText;
    this.margin = margin;
    this.description = description;
    this.ratio = ratio;
    this.priorityText = priorityText;
    this.externalRefText = externalRefText;
    this.batchSize = batchSize;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionManifestView(item: SuppressionManifest): SuppressionManifestView {
  return new SuppressionManifestView(
    item.code,
    item.title,
    item.contactEmail,
    String(item.clicks),
    item.margin.toFixed(2),
    text.truncate(item.description, 64),
    item.ratio.toFixed(2),
    String(item.priority),
    item.externalRef,
    String(item.batchSize),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionManifestViews(items: SuppressionManifest[]): SuppressionManifestView[] {
  const views: SuppressionManifestView[] = [];
  for (const item of items) {
    views.push(toSuppressionManifestView(item));
  }
  return views;
}

export function sumSuppressionManifestView(view: SuppressionManifestView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedClicks + parsedMargin + parsedRatio;
}
