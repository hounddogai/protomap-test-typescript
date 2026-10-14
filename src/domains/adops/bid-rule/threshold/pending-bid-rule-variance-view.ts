import * as text from "../../../../kit/text.js";
import { PendingBidRuleVariance } from "./pending-bid-rule-variance.js";

/** How screens and exports show a pending bid rule variance. */
export class PendingBidRuleVarianceView {
  codeText: string;
  title: string;
  priority: string;
  frequencyCap: string;
  limit: string;
  ratioText: string;
  activeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    priority: string,
    frequencyCap: string,
    limit: string,
    ratioText: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.priority = priority;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.ratioText = ratioText;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingBidRuleVarianceView(item: PendingBidRuleVariance): PendingBidRuleVarianceView {
  return new PendingBidRuleVarianceView(
    text.truncate(item.code, 80),
    item.title,
    String(item.priority),
    String(item.frequencyCap),
    String(item.limit),
    item.ratio.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingBidRuleVarianceViews(items: PendingBidRuleVariance[]): PendingBidRuleVarianceView[] {
  const views: PendingBidRuleVarianceView[] = [];
  for (const item of items) {
    views.push(toPendingBidRuleVarianceView(item));
  }
  return views;
}

export function sumPendingBidRuleVarianceView(view: PendingBidRuleVarianceView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedPriority + parsedFrequencyCap + parsedLimit;
}
