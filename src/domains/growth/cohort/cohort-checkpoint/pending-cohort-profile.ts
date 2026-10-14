import * as text from "../../../../kit/text.js";

/** Where a pending cohort profile is in its life cycle. */
export type PendingCohortProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a pending cohort profile and its current status. */
export class PendingCohortProfile {
  code: string;
  label: string;
  retries: number;
  unit: string;
  externalRef: string;
  timezone: string;
  approved: boolean;
  status: PendingCohortProfileStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    unit: string,
    externalRef: string,
    timezone: string,
    approved: boolean,
    status: PendingCohortProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.unit = unit;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.approved = approved;
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

  canMoveTo(next: PendingCohortProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingCohortProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending cohort profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): PendingCohortProfile {
    return new PendingCohortProfile(
      this.code,
      this.label,
      this.retries,
      this.unit,
      this.externalRef,
      this.timezone,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending cohort profile in status proposed. */
export function newPendingCohortProfile(code: string, label: string): PendingCohortProfile {
  return new PendingCohortProfile(code, label, 0, "", "", "", false, "proposed");
}
