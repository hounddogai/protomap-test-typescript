import * as text from "../../../../kit/text.js";
import { DomainBaseline } from "./domain-baseline.js";

/** How screens and exports show a domain baseline. */
export class DomainBaselineView {
  code: string;
  titleText: string;
  campaignRef: string;
  pinned: string;
  notes: string;
  country: string;
  graceDays: string;
  ratio: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    campaignRef: string,
    pinned: string,
    notes: string,
    country: string,
    graceDays: string,
    ratio: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.notes = notes;
    this.country = country;
    this.graceDays = graceDays;
    this.ratio = ratio;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toDomainBaselineView(item: DomainBaseline): DomainBaselineView {
  return new DomainBaselineView(
    item.code,
    text.truncate(item.title, 120),
    item.campaignRef,
    `${item.pinned}`,
    item.notes,
    text.truncate(item.country, 80),
    String(item.graceDays),
    item.ratio.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainBaselineViews(items: DomainBaseline[]): DomainBaselineView[] {
  const views: DomainBaselineView[] = [];
  for (const item of items) {
    views.push(toDomainBaselineView(item));
  }
  return views;
}

export function sumDomainBaselineView(view: DomainBaselineView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedGraceDays + parsedRatio + parsedBatchSize;
}
