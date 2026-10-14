/**
 * The double opt in score records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in score is in its life cycle. */
export type DoubleOptInScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A double opt in score. Its code is unique within a tenant. */
export class DoubleOptInScore {
  code: string;
  label: string;
  updatedAt: number;
  clicks: number;
  notes: string;
  status: DoubleOptInScoreStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    clicks: number,
    notes: string,
    status: DoubleOptInScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DoubleOptInScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.clicks + this.updatedAt) * 100) / 100;
  }

  copy(): DoubleOptInScore {
    return new DoubleOptInScore(this.code, this.label, this.updatedAt, this.clicks, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a double opt in score in status proposed. */
export function newDoubleOptInScore(code: string, label: string): DoubleOptInScore {
  return new DoubleOptInScore(code, label, 0, 0, "", "proposed");
}
