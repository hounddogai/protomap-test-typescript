/**
 * The badge request records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge request is in its life cycle. */
export type BadgeRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One badge request, with what the planners need to act on it. */
export class BadgeRequest {
  code: string;
  label: string;
  cohort: string;
  durationMinutes: number;
  graceDays: number;
  margin: number;
  expiresAt: number;
  notes: string;
  category: string;
  conversionRate: number;
  status: BadgeRequestStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    durationMinutes: number,
    graceDays: number,
    margin: number,
    expiresAt: number,
    notes: string,
    category: string,
    conversionRate: number,
    status: BadgeRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.durationMinutes = durationMinutes;
    this.graceDays = graceDays;
    this.margin = margin;
    this.expiresAt = expiresAt;
    this.notes = notes;
    this.category = category;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: BadgeRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedExposure(): number {
    return Math.round((this.graceDays + this.margin) * 100) / 100;
  }

  copy(): BadgeRequest {
    return new BadgeRequest(
      this.code,
      this.label,
      this.cohort,
      this.durationMinutes,
      this.graceDays,
      this.margin,
      this.expiresAt,
      this.notes,
      this.category,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a badge request in status proposed. */
export function newBadgeRequest(code: string, label: string): BadgeRequest {
  return new BadgeRequest(code, label, "", 0, 0, 0, 0, "", "", 0, "proposed");
}
