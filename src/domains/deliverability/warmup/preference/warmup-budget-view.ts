import * as text from "../../../../kit/text.js";
import { WarmupBudget } from "./warmup-budget.js";

/** How screens and exports show a warmup budget. */
export class WarmupBudgetView {
  code: string;
  labelText: string;
  campaignRef: string;
  channelText: string;
  visibleText: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    campaignRef: string,
    channelText: string,
    visibleText: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.campaignRef = campaignRef;
    this.channelText = channelText;
    this.visibleText = visibleText;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupBudgetView(item: WarmupBudget): WarmupBudgetView {
  return new WarmupBudgetView(
    item.code,
    item.label,
    text.truncate(item.campaignRef, 120),
    item.channel,
    `${item.visible}`,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupBudgetViews(items: WarmupBudget[]): WarmupBudgetView[] {
  const views: WarmupBudgetView[] = [];
  for (const item of items) {
    views.push(toWarmupBudgetView(item));
  }
  return views;
}

export function sumWarmupBudgetView(view: WarmupBudgetView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedRevision;
}
