import * as text from "../../../../kit/text.js";
import { InsightSummary } from "./insight-summary.js";

/** How screens and exports show a insight summary. */
export class InsightSummaryView {
  code: string;
  label: string;
  country: string;
  ceilingText: string;
  batchSize: string;
  regionText: string;
  archivedText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    country: string,
    ceilingText: string,
    batchSize: string,
    regionText: string,
    archivedText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.ceilingText = ceilingText;
    this.batchSize = batchSize;
    this.regionText = regionText;
    this.archivedText = archivedText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toInsightSummaryView(item: InsightSummary): InsightSummaryView {
  return new InsightSummaryView(
    item.code,
    text.truncate(item.label, 80),
    item.country,
    item.ceiling.toFixed(2),
    String(item.batchSize),
    item.region,
    `${item.archived}`,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightSummaryViews(items: InsightSummary[]): InsightSummaryView[] {
  const views: InsightSummaryView[] = [];
  for (const item of items) {
    views.push(toInsightSummaryView(item));
  }
  return views;
}

export function sumInsightSummaryView(view: InsightSummaryView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedCeiling + parsedBatchSize + parsedMargin;
}
