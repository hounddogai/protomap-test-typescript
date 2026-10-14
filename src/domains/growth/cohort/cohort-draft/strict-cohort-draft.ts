/**
 * The strict cohort draft records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict cohort draft is in its life cycle. */
export type StrictCohortDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict cohort draft as the cohort team keeps it. */
export class StrictCohortDraft {
  code: string;
  label: string;
  conversionRate: number;
  limit: number;
  startsAt: number;
  cost: number;
  batchSize: number;
  rate: number;
  phone: string;
  contactEmail: string;
  score: number;
  status: StrictCohortDraftStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    limit: number,
    startsAt: number,
    cost: number,
    batchSize: number,
    rate: number,
    phone: string,
    contactEmail: string,
    score: number,
    status: StrictCohortDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.limit = limit;
    this.startsAt = startsAt;
    this.cost = cost;
    this.batchSize = batchSize;
    this.rate = rate;
    this.phone = phone;
    this.contactEmail = contactEmail;
    this.score = score;
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

  canMoveTo(next: StrictCohortDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
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

  moveTo(next: StrictCohortDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict cohort draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict cohort draft"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.conversionRate * this.batchSize * 100) / 100;
  }

  copy(): StrictCohortDraft {
    return new StrictCohortDraft(
      this.code,
      this.label,
      this.conversionRate,
      this.limit,
      this.startsAt,
      this.cost,
      this.batchSize,
      this.rate,
      this.phone,
      this.contactEmail,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict cohort draft in status planned. */
export function newStrictCohortDraft(code: string, label: string): StrictCohortDraft {
  return new StrictCohortDraft(code, label, 0, 0, 0, 0, 0, 0, "", "", 0, "planned");
}
