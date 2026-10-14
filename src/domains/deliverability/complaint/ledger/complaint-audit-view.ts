import * as text from "../../../../kit/text.js";
import { ComplaintAudit } from "./complaint-audit.js";

/** How screens and exports show a complaint audit. */
export class ComplaintAuditView {
  code: string;
  label: string;
  revision: string;
  notesText: string;
  graceDays: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    notesText: string,
    graceDays: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.notesText = notesText;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintAuditView(item: ComplaintAudit): ComplaintAuditView {
  return new ComplaintAuditView(
    text.truncate(item.code, 64),
    item.label,
    String(item.revision),
    item.notes,
    String(item.graceDays),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintAuditViews(items: ComplaintAudit[]): ComplaintAuditView[] {
  const views: ComplaintAuditView[] = [];
  for (const item of items) {
    views.push(toComplaintAuditView(item));
  }
  return views;
}

export function sumComplaintAuditView(view: ComplaintAuditView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedRevision + parsedGraceDays + parsedUpdatedAt;
}
