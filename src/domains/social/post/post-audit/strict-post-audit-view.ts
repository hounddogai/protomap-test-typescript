import * as text from "../../../../kit/text.js";
import { StrictPostAudit } from "./strict-post-audit.js";

/** How screens and exports show a strict post audit. */
export class StrictPostAuditView {
  code: string;
  labelText: string;
  locale: string;
  notesText: string;
  cohort: string;
  createdAt: string;
  unit: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    notesText: string,
    cohort: string,
    createdAt: string,
    unit: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.notesText = notesText;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.unit = unit;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPostAuditView(item: StrictPostAudit): StrictPostAuditView {
  return new StrictPostAuditView(
    item.code,
    item.label,
    item.locale,
    text.truncate(item.notes, 64),
    text.truncate(item.cohort, 80),
    String(item.createdAt),
    item.unit,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPostAuditViews(items: StrictPostAudit[]): StrictPostAuditView[] {
  const views: StrictPostAuditView[] = [];
  for (const item of items) {
    views.push(toStrictPostAuditView(item));
  }
  return views;
}

export function sumStrictPostAuditView(view: StrictPostAuditView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedCreatedAt + parsedAttempts;
}
