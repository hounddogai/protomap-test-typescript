import * as text from "../../../../kit/text.js";
import { BatchedBidRuleSummary } from "./batched-bid-rule-summary.js";

/** How screens and exports show a batched bid rule summary. */
export class BatchedBidRuleSummaryView {
  code: string;
  nameText: string;
  activeText: string;
  unit: string;
  revisionText: string;
  impressions: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    activeText: string,
    unit: string,
    revisionText: string,
    impressions: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.activeText = activeText;
    this.unit = unit;
    this.revisionText = revisionText;
    this.impressions = impressions;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedBidRuleSummaryView(item: BatchedBidRuleSummary): BatchedBidRuleSummaryView {
  return new BatchedBidRuleSummaryView(
    text.truncate(item.code, 80),
    item.name,
    `${item.active}`,
    item.unit,
    String(item.revision),
    String(item.impressions),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedBidRuleSummaryViews(items: BatchedBidRuleSummary[]): BatchedBidRuleSummaryView[] {
  const views: BatchedBidRuleSummaryView[] = [];
  for (const item of items) {
    views.push(toBatchedBidRuleSummaryView(item));
  }
  return views;
}

export function sumBatchedBidRuleSummaryView(view: BatchedBidRuleSummaryView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedRevision + parsedImpressions + parsedFrequencyCap;
}
