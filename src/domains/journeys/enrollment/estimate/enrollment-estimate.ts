/**
 * The enrollment estimate records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment estimate is in its life cycle. */
export type EnrollmentEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a enrollment estimate and its current status. */
export class EnrollmentEstimate {
  code: string;
  label: string;
  currency: string;
  cohort: string;
  archived: boolean;
  audienceId: string;
  attempts: number;
  externalRef: string;
  status: EnrollmentEstimateStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    cohort: string,
    archived: boolean,
    audienceId: string,
    attempts: number,
    externalRef: string,
    status: EnrollmentEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.cohort = cohort;
    this.archived = archived;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.externalRef = externalRef;
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

  canMoveTo(next: EnrollmentEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: EnrollmentEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"enrollment estimate"} ${this.code}`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): EnrollmentEstimate {
    return new EnrollmentEstimate(
      this.code,
      this.label,
      this.currency,
      this.cohort,
      this.archived,
      this.audienceId,
      this.attempts,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a enrollment estimate in status planned. */
export function newEnrollmentEstimate(code: string, label: string): EnrollmentEstimate {
  return new EnrollmentEstimate(code, label, "", "", false, "", 0, "", "planned");
}
