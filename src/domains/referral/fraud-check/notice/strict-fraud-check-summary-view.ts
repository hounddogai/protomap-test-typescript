import * as text from "../../../../kit/text.js";
import { StrictFraudCheckSummary } from "./strict-fraud-check-summary.js";

/** How screens and exports show a strict fraud check summary. */
export class StrictFraudCheckSummaryView {
  code: string;
  labelText: string;
  version: string;
  threshold: string;
  conversionRate: string;
  contactEmailText: string;
  revisionText: string;
  clicksText: string;
  pinned: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    version: string,
    threshold: string,
    conversionRate: string,
    contactEmailText: string,
    revisionText: string,
    clicksText: string,
    pinned: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.version = version;
    this.threshold = threshold;
    this.conversionRate = conversionRate;
    this.contactEmailText = contactEmailText;
    this.revisionText = revisionText;
    this.clicksText = clicksText;
    this.pinned = pinned;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFraudCheckSummaryView(item: StrictFraudCheckSummary): StrictFraudCheckSummaryView {
  return new StrictFraudCheckSummaryView(
    item.code,
    text.truncate(item.label, 80),
    String(item.version),
    item.threshold.toFixed(2),
    item.conversionRate.toFixed(2),
    item.contactEmail,
    String(item.revision),
    String(item.clicks),
    `${item.pinned}`,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFraudCheckSummaryViews(items: StrictFraudCheckSummary[]): StrictFraudCheckSummaryView[] {
  const views: StrictFraudCheckSummaryView[] = [];
  for (const item of items) {
    views.push(toStrictFraudCheckSummaryView(item));
  }
  return views;
}

export function sumStrictFraudCheckSummaryView(view: StrictFraudCheckSummaryView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedVersion + parsedThreshold + parsedConversionRate;
}
