import * as text from "../../../../kit/text.js";
import { StrictReplyBudget } from "./strict-reply-budget.js";

/** How screens and exports show a strict reply budget. */
export class StrictReplyBudgetView {
  codeText: string;
  label: string;
  region: string;
  frequencyCap: string;
  openRate: string;
  updatedAt: string;
  expiresAt: string;
  revision: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    region: string,
    frequencyCap: string,
    openRate: string,
    updatedAt: string,
    expiresAt: string,
    revision: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.region = region;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
    this.expiresAt = expiresAt;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toStrictReplyBudgetView(item: StrictReplyBudget): StrictReplyBudgetView {
  return new StrictReplyBudgetView(
    item.code,
    text.truncate(item.label, 64),
    item.region,
    String(item.frequencyCap),
    item.openRate.toFixed(2),
    String(item.updatedAt),
    String(item.expiresAt),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictReplyBudgetViews(items: StrictReplyBudget[]): StrictReplyBudgetView[] {
  const views: StrictReplyBudgetView[] = [];
  for (const item of items) {
    views.push(toStrictReplyBudgetView(item));
  }
  return views;
}

export function sumStrictReplyBudgetView(view: StrictReplyBudgetView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedFrequencyCap + parsedOpenRate + parsedUpdatedAt;
}
