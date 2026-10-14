import * as text from "../../../../kit/text.js";
import { ManualBounceThreshold } from "./manual-bounce-threshold.js";

/** How screens and exports show a manual bounce threshold. */
export class ManualBounceThresholdView {
  code: string;
  name: string;
  revisionText: string;
  externalRef: string;
  conversionRate: string;
  maximumText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revisionText: string,
    externalRef: string,
    conversionRate: string,
    maximumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revisionText = revisionText;
    this.externalRef = externalRef;
    this.conversionRate = conversionRate;
    this.maximumText = maximumText;
    this.statusLabel = statusLabel;
  }
}

export function toManualBounceThresholdView(item: ManualBounceThreshold): ManualBounceThresholdView {
  return new ManualBounceThresholdView(
    item.code,
    text.truncate(item.name, 40),
    String(item.revision),
    item.externalRef,
    item.conversionRate.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBounceThresholdViews(items: ManualBounceThreshold[]): ManualBounceThresholdView[] {
  const views: ManualBounceThresholdView[] = [];
  for (const item of items) {
    views.push(toManualBounceThresholdView(item));
  }
  return views;
}

export function sumManualBounceThresholdView(view: ManualBounceThresholdView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedRevision + parsedConversionRate + parsedMaximum;
}
