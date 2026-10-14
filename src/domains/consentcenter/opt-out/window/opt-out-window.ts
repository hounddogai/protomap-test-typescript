/**
 * The opt out window records of consentcenter's opt out work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out window is in its life cycle. */
export type OptOutWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A opt out window as the opt out team keeps it. */
export class OptOutWindow {
  code: string;
  title: string;
  label: string;
  notes: string;
  durationMinutes: number;
  utmSource: string;
  minimum: number;
  unit: string;
  ceiling: number;
  cohort: string;
  status: OptOutWindowStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    notes: string,
    durationMinutes: number,
    utmSource: string,
    minimum: number,
    unit: string,
    ceiling: number,
    cohort: string,
    status: OptOutWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
    this.minimum = minimum;
    this.unit = unit;
    this.ceiling = ceiling;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: OptOutWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round(this.durationMinutes * this.ceiling * 100) / 100;
  }

  copy(): OptOutWindow {
    return new OptOutWindow(
      this.code,
      this.title,
      this.label,
      this.notes,
      this.durationMinutes,
      this.utmSource,
      this.minimum,
      this.unit,
      this.ceiling,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a opt out window in status draft. */
export function newOptOutWindow(code: string, title: string): OptOutWindow {
  return new OptOutWindow(code, title, "", "", 0, "", 0, "", 0, "", "draft");
}
