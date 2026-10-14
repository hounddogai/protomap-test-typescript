/**
 * The global conversion window records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global conversion window is in its life cycle. */
export type GlobalConversionWindowStatus = "created" | "validated" | "published" | "retired";

/** One global conversion window, with what the planners need to act on it. */
export class GlobalConversionWindow {
  code: string;
  label: string;
  cohort: string;
  ownerId: string;
  region: string;
  currency: string;
  durationMinutes: number;
  amount: number;
  locale: string;
  status: GlobalConversionWindowStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    ownerId: string,
    region: string,
    currency: string,
    durationMinutes: number,
    amount: number,
    locale: string,
    status: GlobalConversionWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.ownerId = ownerId;
    this.region = region;
    this.currency = currency;
    this.durationMinutes = durationMinutes;
    this.amount = amount;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalConversionWindowStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalConversionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global conversion window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"global conversion window"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.amount * this.durationMinutes * 100) / 100;
  }

  copy(): GlobalConversionWindow {
    return new GlobalConversionWindow(
      this.code,
      this.label,
      this.cohort,
      this.ownerId,
      this.region,
      this.currency,
      this.durationMinutes,
      this.amount,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global conversion window in status created. */
export function newGlobalConversionWindow(code: string, label: string): GlobalConversionWindow {
  return new GlobalConversionWindow(code, label, "", "", "", "", 0, 0, "", "created");
}
