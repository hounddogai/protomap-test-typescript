/**
 * The pending cohort variance records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending cohort variance is in its life cycle. */
export type PendingCohortVarianceStatus = "created" | "validated" | "published" | "retired";

/** One pending cohort variance, with what the planners need to act on it. */
export class PendingCohortVariance {
  code: string;
  label: string;
  externalRef: string;
  source: string;
  campaignRef: string;
  score: number;
  status: PendingCohortVarianceStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    source: string,
    campaignRef: string,
    score: number,
    status: PendingCohortVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.source = source;
    this.campaignRef = campaignRef;
    this.score = score;
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

  canMoveTo(next: PendingCohortVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingCohortVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending cohort variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending cohort variance"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PendingCohortVariance {
    return new PendingCohortVariance(
      this.code,
      this.label,
      this.externalRef,
      this.source,
      this.campaignRef,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pending cohort variance in status created. */
export function newPendingCohortVariance(code: string, label: string): PendingCohortVariance {
  return new PendingCohortVariance(code, label, "", "", "", 0, "created");
}
