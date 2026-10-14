import * as text from "../../../../kit/text.js";
import { BatchedRewardRule } from "./batched-reward-rule.js";

/** How screens and exports show a batched reward rule. */
export class BatchedRewardRuleView {
  codeText: string;
  label: string;
  rateText: string;
  locale: string;
  utmSource: string;
  country: string;
  limitText: string;
  archived: string;
  retries: string;
  sendAtText: string;
  discountText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    rateText: string,
    locale: string,
    utmSource: string,
    country: string,
    limitText: string,
    archived: string,
    retries: string,
    sendAtText: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.rateText = rateText;
    this.locale = locale;
    this.utmSource = utmSource;
    this.country = country;
    this.limitText = limitText;
    this.archived = archived;
    this.retries = retries;
    this.sendAtText = sendAtText;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedRewardRuleView(item: BatchedRewardRule): BatchedRewardRuleView {
  return new BatchedRewardRuleView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    text.truncate(item.locale, 40),
    text.truncate(item.utmSource, 120),
    text.truncate(item.country, 80),
    String(item.limit),
    `${item.archived}`,
    String(item.retries),
    String(item.sendAt),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedRewardRuleViews(items: BatchedRewardRule[]): BatchedRewardRuleView[] {
  const views: BatchedRewardRuleView[] = [];
  for (const item of items) {
    views.push(toBatchedRewardRuleView(item));
  }
  return views;
}

export function sumBatchedRewardRuleView(view: BatchedRewardRuleView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRate + parsedLimit + parsedRetries;
}
