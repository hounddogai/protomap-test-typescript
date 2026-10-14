import * as text from "../../../../kit/text.js";
import { AdaptiveReplyBudget } from "./adaptive-reply-budget.js";

/** How screens and exports show a adaptive reply budget. */
export class AdaptiveReplyBudgetView {
  codeText: string;
  name: string;
  thresholdText: string;
  marginText: string;
  sequenceText: string;
  conversionRate: string;
  expiresAt: string;
  discount: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    thresholdText: string,
    marginText: string,
    sequenceText: string,
    conversionRate: string,
    expiresAt: string,
    discount: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.thresholdText = thresholdText;
    this.marginText = marginText;
    this.sequenceText = sequenceText;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveReplyBudgetView(item: AdaptiveReplyBudget): AdaptiveReplyBudgetView {
  return new AdaptiveReplyBudgetView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    item.margin.toFixed(2),
    String(item.sequence),
    item.conversionRate.toFixed(2),
    String(item.expiresAt),
    item.discount.toFixed(2),
    text.truncate(item.summary, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveReplyBudgetViews(items: AdaptiveReplyBudget[]): AdaptiveReplyBudgetView[] {
  const views: AdaptiveReplyBudgetView[] = [];
  for (const item of items) {
    views.push(toAdaptiveReplyBudgetView(item));
  }
  return views;
}

export function sumAdaptiveReplyBudgetView(view: AdaptiveReplyBudgetView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedThreshold + parsedMargin + parsedSequence;
}
