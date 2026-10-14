import * as text from "../../../../kit/text.js";
import { InsightPolicy } from "./insight-policy.js";

/** How screens and exports show a insight policy. */
export class InsightPolicyView {
  code: string;
  title: string;
  categoryText: string;
  reviewer: string;
  visible: string;
  archived: string;
  notesText: string;
  externalRef: string;
  cohort: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    categoryText: string,
    reviewer: string,
    visible: string,
    archived: string,
    notesText: string,
    externalRef: string,
    cohort: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.categoryText = categoryText;
    this.reviewer = reviewer;
    this.visible = visible;
    this.archived = archived;
    this.notesText = notesText;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toInsightPolicyView(item: InsightPolicy): InsightPolicyView {
  return new InsightPolicyView(
    text.truncate(item.code, 120),
    item.title,
    item.category,
    item.reviewer,
    `${item.visible}`,
    `${item.archived}`,
    item.notes,
    item.externalRef,
    item.cohort,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightPolicyViews(items: InsightPolicy[]): InsightPolicyView[] {
  const views: InsightPolicyView[] = [];
  for (const item of items) {
    views.push(toInsightPolicyView(item));
  }
  return views;
}

export function sumInsightPolicyView(view: InsightPolicyView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
