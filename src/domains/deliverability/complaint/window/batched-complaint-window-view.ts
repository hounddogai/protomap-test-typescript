import * as text from "../../../../kit/text.js";
import { BatchedComplaintWindow } from "./batched-complaint-window.js";

/** How screens and exports show a batched complaint window. */
export class BatchedComplaintWindowView {
  codeText: string;
  titleText: string;
  variantText: string;
  impressionsText: string;
  unit: string;
  locale: string;
  name: string;
  journeyIdText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    variantText: string,
    impressionsText: string,
    unit: string,
    locale: string,
    name: string,
    journeyIdText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.variantText = variantText;
    this.impressionsText = impressionsText;
    this.unit = unit;
    this.locale = locale;
    this.name = name;
    this.journeyIdText = journeyIdText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedComplaintWindowView(item: BatchedComplaintWindow): BatchedComplaintWindowView {
  return new BatchedComplaintWindowView(
    item.code,
    item.title,
    item.variant,
    String(item.impressions),
    item.unit,
    item.locale,
    item.name,
    item.journeyId,
    text.truncate(item.summary, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedComplaintWindowViews(items: BatchedComplaintWindow[]): BatchedComplaintWindowView[] {
  const views: BatchedComplaintWindowView[] = [];
  for (const item of items) {
    views.push(toBatchedComplaintWindowView(item));
  }
  return views;
}

export function sumBatchedComplaintWindowView(view: BatchedComplaintWindowView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedImpressions;
}
