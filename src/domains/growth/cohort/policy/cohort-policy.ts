/**
 * The cohort policy records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort policy is in its life cycle. */
export type CohortPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A cohort policy as the cohort team keeps it. */
export class CohortPolicy {
  code: string;
  label: string;
  locale: string;
  archived: boolean;
  clicks: number;
  checksum: string;
  status: CohortPolicyStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    archived: boolean,
    clicks: number,
    checksum: string,
    status: CohortPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.archived = archived;
    this.clicks = clicks;
    this.checksum = checksum;
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

  canMoveTo(next: CohortPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CohortPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): CohortPolicy {
    return new CohortPolicy(this.code, this.label, this.locale, this.archived, this.clicks, this.checksum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a cohort policy in status proposed. */
export function newCohortPolicy(code: string, label: string): CohortPolicy {
  return new CohortPolicy(code, label, "", false, 0, "", "proposed");
}
