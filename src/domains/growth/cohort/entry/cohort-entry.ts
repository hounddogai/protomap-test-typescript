/**
 * The cohort entry records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort entry is in its life cycle. */
export type CohortEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A cohort entry. Its code is unique within a tenant. */
export class CohortEntry {
  code: string;
  label: string;
  reviewer: string;
  currency: string;
  rate: number;
  createdAt: number;
  journeyId: string;
  status: CohortEntryStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    currency: string,
    rate: number,
    createdAt: number,
    journeyId: string,
    status: CohortEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.currency = currency;
    this.rate = rate;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.rate - this.createdAt) * 100) / 100;
  }

  copy(): CohortEntry {
    return new CohortEntry(
      this.code,
      this.label,
      this.reviewer,
      this.currency,
      this.rate,
      this.createdAt,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a cohort entry in status open. */
export function newCohortEntry(code: string, label: string): CohortEntry {
  return new CohortEntry(code, label, "", "", 0, 0, "", "open");
}
