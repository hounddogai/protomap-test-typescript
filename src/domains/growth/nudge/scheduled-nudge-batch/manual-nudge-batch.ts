/**
 * The manual nudge batch records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual nudge batch is in its life cycle. */
export type ManualNudgeBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual nudge batch as the nudge team keeps it. */
export class ManualNudgeBatch {
  code: string;
  label: string;
  timezone: string;
  ceiling: number;
  country: string;
  unit: string;
  status: ManualNudgeBatchStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    ceiling: number,
    country: string,
    unit: string,
    status: ManualNudgeBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.country = country;
    this.unit = unit;
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

  canMoveTo(next: ManualNudgeBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualNudgeBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual nudge batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): ManualNudgeBatch {
    return new ManualNudgeBatch(
      this.code,
      this.label,
      this.timezone,
      this.ceiling,
      this.country,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual nudge batch in status planned. */
export function newManualNudgeBatch(code: string, label: string): ManualNudgeBatch {
  return new ManualNudgeBatch(code, label, "", 0, "", "", "planned");
}
