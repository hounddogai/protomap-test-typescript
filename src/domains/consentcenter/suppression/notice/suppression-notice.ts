/**
 * The suppression notice records of consentcenter's suppression work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression notice is in its life cycle. */
export type SuppressionNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression notice. Its code is unique within a tenant. */
export class SuppressionNotice {
  code: string;
  name: string;
  title: string;
  durationMinutes: number;
  source: string;
  archived: boolean;
  cohort: string;
  contactEmail: string;
  notes: string;
  locale: string;
  status: SuppressionNoticeStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    durationMinutes: number,
    source: string,
    archived: boolean,
    cohort: string,
    contactEmail: string,
    notes: string,
    locale: string,
    status: SuppressionNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.source = source;
    this.archived = archived;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.notes = notes;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SuppressionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"suppression notice"} ${this.code}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): SuppressionNotice {
    return new SuppressionNotice(
      this.code,
      this.name,
      this.title,
      this.durationMinutes,
      this.source,
      this.archived,
      this.cohort,
      this.contactEmail,
      this.notes,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a suppression notice in status planned. */
export function newSuppressionNotice(code: string, name: string): SuppressionNotice {
  return new SuppressionNotice(code, name, "", 0, "", false, "", "", "", "", "planned");
}
