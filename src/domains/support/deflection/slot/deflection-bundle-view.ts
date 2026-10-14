import * as text from "../../../../kit/text.js";
import { DeflectionBundle } from "./deflection-bundle.js";

/** How screens and exports show a deflection bundle. */
export class DeflectionBundleView {
  codeText: string;
  title: string;
  journeyId: string;
  label: string;
  contactEmail: string;
  batchSize: string;
  updatedAt: string;
  utmSourceText: string;
  impressions: string;
  unit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    journeyId: string,
    label: string,
    contactEmail: string,
    batchSize: string,
    updatedAt: string,
    utmSourceText: string,
    impressions: string,
    unit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.journeyId = journeyId;
    this.label = label;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.updatedAt = updatedAt;
    this.utmSourceText = utmSourceText;
    this.impressions = impressions;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionBundleView(item: DeflectionBundle): DeflectionBundleView {
  return new DeflectionBundleView(
    item.code,
    text.truncate(item.title, 40),
    item.journeyId,
    text.truncate(item.label, 40),
    text.truncate(item.contactEmail, 80),
    String(item.batchSize),
    String(item.updatedAt),
    item.utmSource,
    String(item.impressions),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionBundleViews(items: DeflectionBundle[]): DeflectionBundleView[] {
  const views: DeflectionBundleView[] = [];
  for (const item of items) {
    views.push(toDeflectionBundleView(item));
  }
  return views;
}

export function sumDeflectionBundleView(view: DeflectionBundleView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedBatchSize + parsedUpdatedAt + parsedImpressions;
}
