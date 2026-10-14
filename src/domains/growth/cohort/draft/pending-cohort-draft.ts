/**
 * The pending cohort draft records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending cohort draft is in its life cycle. */
export type PendingCohortDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pending cohort draft. Its code is unique within a tenant. */
export class PendingCohortDraft {
  code: string;
  label: string;
  frequencyCap: number;
  durationMinutes: number;
  reviewer: string;
  notes: string;
  checksum: string;
  capacity: number;
  country: string;
  variant: string;
  active: boolean;
  status: PendingCohortDraftStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    durationMinutes: number,
    reviewer: string,
    notes: string,
    checksum: string,
    capacity: number,
    country: string,
    variant: string,
    active: boolean,
    status: PendingCohortDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.durationMinutes = durationMinutes;
    this.reviewer = reviewer;
    this.notes = notes;
    this.checksum = checksum;
    this.capacity = capacity;
    this.country = country;
    this.variant = variant;
    this.active = active;
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

  canMoveTo(next: PendingCohortDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCohortDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending cohort draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.capacity - this.frequencyCap) * 100) / 100;
  }

  copy(): PendingCohortDraft {
    return new PendingCohortDraft(
      this.code,
      this.label,
      this.frequencyCap,
      this.durationMinutes,
      this.reviewer,
      this.notes,
      this.checksum,
      this.capacity,
      this.country,
      this.variant,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending cohort draft in status open. */
export function newPendingCohortDraft(code: string, label: string): PendingCohortDraft {
  return new PendingCohortDraft(code, label, 0, 0, "", "", "", 0, "", "", false, "open");
}
