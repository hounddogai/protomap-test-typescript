import * as text from "../../../../kit/text.js";
import { ApprovalBatch } from "./approval-batch.js";

/** How screens and exports show a approval batch. */
export class ApprovalBatchView {
  codeText: string;
  name: string;
  region: string;
  contactEmailText: string;
  weight: string;
  ceiling: string;
  label: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    region: string,
    contactEmailText: string,
    weight: string,
    ceiling: string,
    label: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.region = region;
    this.contactEmailText = contactEmailText;
    this.weight = weight;
    this.ceiling = ceiling;
    this.label = label;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalBatchView(item: ApprovalBatch): ApprovalBatchView {
  return new ApprovalBatchView(
    item.code,
    item.name,
    item.region,
    text.truncate(item.contactEmail, 120),
    item.weight.toFixed(2),
    item.ceiling.toFixed(2),
    item.label,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalBatchViews(items: ApprovalBatch[]): ApprovalBatchView[] {
  const views: ApprovalBatchView[] = [];
  for (const item of items) {
    views.push(toApprovalBatchView(item));
  }
  return views;
}

export function sumApprovalBatchView(view: ApprovalBatchView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedWeight + parsedCeiling + parsedUpdatedAt;
}
