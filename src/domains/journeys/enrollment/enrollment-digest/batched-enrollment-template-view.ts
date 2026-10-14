import * as text from "../../../../kit/text.js";
import { BatchedEnrollmentTemplate } from "./batched-enrollment-template.js";

/** How screens and exports show a batched enrollment template. */
export class BatchedEnrollmentTemplateView {
  code: string;
  labelText: string;
  expiresAtText: string;
  approved: string;
  statusLabel: string;

  constructor(code: string, labelText: string, expiresAtText: string, approved: string, statusLabel: string) {
    this.code = code;
    this.labelText = labelText;
    this.expiresAtText = expiresAtText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedEnrollmentTemplateView(item: BatchedEnrollmentTemplate): BatchedEnrollmentTemplateView {
  return new BatchedEnrollmentTemplateView(
    item.code,
    text.truncate(item.label, 80),
    String(item.expiresAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedEnrollmentTemplateViews(items: BatchedEnrollmentTemplate[]): BatchedEnrollmentTemplateView[] {
  const views: BatchedEnrollmentTemplateView[] = [];
  for (const item of items) {
    views.push(toBatchedEnrollmentTemplateView(item));
  }
  return views;
}

export function sumBatchedEnrollmentTemplateView(view: BatchedEnrollmentTemplateView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedExpiresAt;
}
