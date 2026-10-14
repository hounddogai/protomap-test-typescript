import * as text from "../../../../kit/text.js";
import { CohortBudget } from "./cohort-budget.js";

/** How screens and exports show a cohort budget. */
export class CohortBudgetView {
  code: string;
  titleText: string;
  sendAtText: string;
  source: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    sendAtText: string,
    source: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.sendAtText = sendAtText;
    this.source = source;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toCohortBudgetView(item: CohortBudget): CohortBudgetView {
  return new CohortBudgetView(
    text.truncate(item.code, 80),
    item.title,
    String(item.sendAt),
    item.source,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortBudgetViews(items: CohortBudget[]): CohortBudgetView[] {
  const views: CohortBudgetView[] = [];
  for (const item of items) {
    views.push(toCohortBudgetView(item));
  }
  return views;
}

export function sumCohortBudgetView(view: CohortBudgetView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSendAt + parsedSequence;
}
