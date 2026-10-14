import * as text from "../../../../kit/text.js";
import { BatchedApprovalGroup } from "./batched-approval-group.js";

/** How screens and exports show a batched approval group. */
export class BatchedApprovalGroupView {
  code: string;
  name: string;
  journeyId: string;
  locale: string;
  contactEmail: string;
  priorityText: string;
  graceDays: string;
  utmSource: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    locale: string,
    contactEmail: string,
    priorityText: string,
    graceDays: string,
    utmSource: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.priorityText = priorityText;
    this.graceDays = graceDays;
    this.utmSource = utmSource;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedApprovalGroupView(item: BatchedApprovalGroup): BatchedApprovalGroupView {
  return new BatchedApprovalGroupView(
    text.truncate(item.code, 64),
    item.name,
    item.journeyId,
    text.truncate(item.locale, 40),
    item.contactEmail,
    String(item.priority),
    String(item.graceDays),
    item.utmSource,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedApprovalGroupViews(items: BatchedApprovalGroup[]): BatchedApprovalGroupView[] {
  const views: BatchedApprovalGroupView[] = [];
  for (const item of items) {
    views.push(toBatchedApprovalGroupView(item));
  }
  return views;
}

export function sumBatchedApprovalGroupView(view: BatchedApprovalGroupView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedPriority + parsedGraceDays + parsedMaximum;
}
