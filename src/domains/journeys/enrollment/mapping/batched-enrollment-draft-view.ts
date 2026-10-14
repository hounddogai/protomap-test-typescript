import * as text from "../../../../kit/text.js";
import { BatchedEnrollmentDraft } from "./batched-enrollment-draft.js";

/** How screens and exports show a batched enrollment draft. */
export class BatchedEnrollmentDraftView {
  code: string;
  labelText: string;
  variantText: string;
  pinned: string;
  active: string;
  nameText: string;
  locale: string;
  sendAtText: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    variantText: string,
    pinned: string,
    active: string,
    nameText: string,
    locale: string,
    sendAtText: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.variantText = variantText;
    this.pinned = pinned;
    this.active = active;
    this.nameText = nameText;
    this.locale = locale;
    this.sendAtText = sendAtText;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedEnrollmentDraftView(item: BatchedEnrollmentDraft): BatchedEnrollmentDraftView {
  return new BatchedEnrollmentDraftView(
    text.truncate(item.code, 120),
    item.label,
    item.variant,
    `${item.pinned}`,
    `${item.active}`,
    text.truncate(item.name, 40),
    item.locale,
    String(item.sendAt),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedEnrollmentDraftViews(items: BatchedEnrollmentDraft[]): BatchedEnrollmentDraftView[] {
  const views: BatchedEnrollmentDraftView[] = [];
  for (const item of items) {
    views.push(toBatchedEnrollmentDraftView(item));
  }
  return views;
}

export function sumBatchedEnrollmentDraftView(view: BatchedEnrollmentDraftView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedSendAt;
}
