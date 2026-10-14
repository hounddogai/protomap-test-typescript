import * as text from "../../../../kit/text.js";
import { ManualBranchTemplate } from "./manual-branch-template.js";

/** How screens and exports show a manual branch template. */
export class ManualBranchTemplateView {
  code: string;
  label: string;
  openRateText: string;
  source: string;
  ratio: string;
  maximum: string;
  bid: string;
  externalRef: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    openRateText: string,
    source: string,
    ratio: string,
    maximum: string,
    bid: string,
    externalRef: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.openRateText = openRateText;
    this.source = source;
    this.ratio = ratio;
    this.maximum = maximum;
    this.bid = bid;
    this.externalRef = externalRef;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toManualBranchTemplateView(item: ManualBranchTemplate): ManualBranchTemplateView {
  return new ManualBranchTemplateView(
    item.code,
    item.label,
    item.openRate.toFixed(2),
    item.source,
    item.ratio.toFixed(2),
    item.maximum.toFixed(2),
    item.bid.toFixed(2),
    text.truncate(item.externalRef, 40),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBranchTemplateViews(items: ManualBranchTemplate[]): ManualBranchTemplateView[] {
  const views: ManualBranchTemplateView[] = [];
  for (const item of items) {
    views.push(toManualBranchTemplateView(item));
  }
  return views;
}

export function sumManualBranchTemplateView(view: ManualBranchTemplateView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedOpenRate + parsedRatio + parsedMaximum;
}
