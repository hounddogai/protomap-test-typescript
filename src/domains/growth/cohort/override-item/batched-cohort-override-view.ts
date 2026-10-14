import * as text from "../../../../kit/text.js";
import { BatchedCohortOverride } from "./batched-cohort-override.js";

/** How screens and exports show a batched cohort override. */
export class BatchedCohortOverrideView {
  codeText: string;
  name: string;
  approved: string;
  utmSourceText: string;
  segment: string;
  label: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    approved: string,
    utmSourceText: string,
    segment: string,
    label: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.approved = approved;
    this.utmSourceText = utmSourceText;
    this.segment = segment;
    this.label = label;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCohortOverrideView(item: BatchedCohortOverride): BatchedCohortOverrideView {
  return new BatchedCohortOverrideView(
    text.truncate(item.code, 64),
    item.name,
    `${item.approved}`,
    item.utmSource,
    item.segment,
    item.label,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCohortOverrideViews(items: BatchedCohortOverride[]): BatchedCohortOverrideView[] {
  const views: BatchedCohortOverrideView[] = [];
  for (const item of items) {
    views.push(toBatchedCohortOverrideView(item));
  }
  return views;
}

export function sumBatchedCohortOverrideView(view: BatchedCohortOverrideView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
