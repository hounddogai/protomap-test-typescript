import * as text from "../../../../kit/text.js";
import { BatchedInsightException } from "./batched-insight-exception.js";

/** How screens and exports show a batched insight exception. */
export class BatchedInsightExceptionView {
  codeText: string;
  title: string;
  description: string;
  locale: string;
  priorityText: string;
  country: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    description: string,
    locale: string,
    priorityText: string,
    country: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.description = description;
    this.locale = locale;
    this.priorityText = priorityText;
    this.country = country;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedInsightExceptionView(item: BatchedInsightException): BatchedInsightExceptionView {
  return new BatchedInsightExceptionView(
    text.truncate(item.code, 64),
    item.title,
    item.description,
    text.truncate(item.locale, 40),
    String(item.priority),
    text.truncate(item.country, 40),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedInsightExceptionViews(items: BatchedInsightException[]): BatchedInsightExceptionView[] {
  const views: BatchedInsightExceptionView[] = [];
  for (const item of items) {
    views.push(toBatchedInsightExceptionView(item));
  }
  return views;
}

export function sumBatchedInsightExceptionView(view: BatchedInsightExceptionView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedPriority + parsedCeiling;
}
