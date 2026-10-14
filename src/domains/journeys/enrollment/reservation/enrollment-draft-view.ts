import { EnrollmentDraft } from "./enrollment-draft.js";

/** How screens and exports show a enrollment draft. */
export class EnrollmentDraftView {
  codeText: string;
  label: string;
  maximum: string;
  segment: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    maximum: string,
    segment: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.maximum = maximum;
    this.segment = segment;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentDraftView(item: EnrollmentDraft): EnrollmentDraftView {
  return new EnrollmentDraftView(
    item.code,
    item.label,
    item.maximum.toFixed(2),
    item.segment,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentDraftViews(items: EnrollmentDraft[]): EnrollmentDraftView[] {
  const views: EnrollmentDraftView[] = [];
  for (const item of items) {
    views.push(toEnrollmentDraftView(item));
  }
  return views;
}

export function sumEnrollmentDraftView(view: EnrollmentDraftView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedMaximum + parsedExpiresAt;
}
