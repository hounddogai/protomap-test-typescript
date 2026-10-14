import * as text from "../../../../kit/text.js";
import { RetentionSummary } from "./retention-summary.js";

/** How screens and exports show a retention summary. */
export class RetentionSummaryView {
  code: string;
  name: string;
  budget: string;
  summary: string;
  localeText: string;
  description: string;
  notes: string;
  currencyText: string;
  updatedAt: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    summary: string,
    localeText: string,
    description: string,
    notes: string,
    currencyText: string,
    updatedAt: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.summary = summary;
    this.localeText = localeText;
    this.description = description;
    this.notes = notes;
    this.currencyText = currencyText;
    this.updatedAt = updatedAt;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionSummaryView(item: RetentionSummary): RetentionSummaryView {
  return new RetentionSummaryView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    item.summary,
    item.locale,
    text.truncate(item.description, 64),
    item.notes,
    item.currency,
    String(item.updatedAt),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionSummaryViews(items: RetentionSummary[]): RetentionSummaryView[] {
  const views: RetentionSummaryView[] = [];
  for (const item of items) {
    views.push(toRetentionSummaryView(item));
  }
  return views;
}

export function sumRetentionSummaryView(view: RetentionSummaryView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedBudget + parsedUpdatedAt + parsedSequence;
}
