/**
 * The strict post audit records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict post audit is in its life cycle. */
export type StrictPostAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict post audit as the post team keeps it. */
export class StrictPostAudit {
  code: string;
  label: string;
  locale: string;
  notes: string;
  cohort: string;
  createdAt: number;
  attributes: Map<string, string>;
  unit: string;
  attempts: number;
  status: StrictPostAuditStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    notes: string,
    cohort: string,
    createdAt: number,
    attributes: Map<string, string>,
    unit: string,
    attempts: number,
    status: StrictPostAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.notes = notes;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.attributes = attributes;
    this.unit = unit;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPostAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPostAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict post audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round(this.createdAt * this.attempts * 100) / 100;
  }

  copy(): StrictPostAudit {
    return new StrictPostAudit(
      this.code,
      this.label,
      this.locale,
      this.notes,
      this.cohort,
      this.createdAt,
      this.attributes,
      this.unit,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict post audit in status requested. */
export function newStrictPostAudit(code: string, label: string): StrictPostAudit {
  return new StrictPostAudit(code, label, "", "", "", 0, new Map<string, string>(), "", 0, "requested");
}
