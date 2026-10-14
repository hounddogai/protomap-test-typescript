import * as text from "../../../../kit/text.js";
import { BatchedRetentionTier } from "./batched-retention-tier.js";

/** How screens and exports show a batched retention tier. */
export class BatchedRetentionTierView {
  code: string;
  nameText: string;
  archived: string;
  sourceText: string;
  sendAtText: string;
  locale: string;
  endsAt: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    archived: string,
    sourceText: string,
    sendAtText: string,
    locale: string,
    endsAt: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.archived = archived;
    this.sourceText = sourceText;
    this.sendAtText = sendAtText;
    this.locale = locale;
    this.endsAt = endsAt;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedRetentionTierView(item: BatchedRetentionTier): BatchedRetentionTierView {
  return new BatchedRetentionTierView(
    item.code,
    text.truncate(item.name, 80),
    `${item.archived}`,
    item.source,
    String(item.sendAt),
    item.locale,
    String(item.endsAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedRetentionTierViews(items: BatchedRetentionTier[]): BatchedRetentionTierView[] {
  const views: BatchedRetentionTierView[] = [];
  for (const item of items) {
    views.push(toBatchedRetentionTierView(item));
  }
  return views;
}

export function sumBatchedRetentionTierView(view: BatchedRetentionTierView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedSendAt + parsedEndsAt + parsedBudget;
}
