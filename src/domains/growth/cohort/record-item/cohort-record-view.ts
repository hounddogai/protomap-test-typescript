import * as text from "../../../../kit/text.js";
import { CohortRecord } from "./cohort-record.js";

/** How screens and exports show a cohort record. */
export class CohortRecordView {
  code: string;
  label: string;
  visible: string;
  archivedText: string;
  summary: string;
  description: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visible: string,
    archivedText: string,
    summary: string,
    description: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.archivedText = archivedText;
    this.summary = summary;
    this.description = description;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toCohortRecordView(item: CohortRecord): CohortRecordView {
  return new CohortRecordView(
    text.truncate(item.code, 120),
    item.label,
    `${item.visible}`,
    `${item.archived}`,
    item.summary,
    item.description,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortRecordViews(items: CohortRecord[]): CohortRecordView[] {
  const views: CohortRecordView[] = [];
  for (const item of items) {
    views.push(toCohortRecordView(item));
  }
  return views;
}

export function sumCohortRecordView(view: CohortRecordView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
