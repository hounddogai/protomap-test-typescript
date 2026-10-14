/**
 * The adaptive payout assignment records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive payout assignment is in its life cycle. */
export type AdaptivePayoutAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One adaptive payout assignment, with what the planners need to act on it. */
export class AdaptivePayoutAssignment {
  code: string;
  title: string;
  batchSize: number;
  expiresAt: number;
  budget: number;
  status: AdaptivePayoutAssignmentStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    expiresAt: number,
    budget: number,
    status: AdaptivePayoutAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.expiresAt = expiresAt;
    this.budget = budget;
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

  canMoveTo(next: AdaptivePayoutAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePayoutAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive payout assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.expiresAt - this.batchSize) * 100) / 100;
  }

  copy(): AdaptivePayoutAssignment {
    return new AdaptivePayoutAssignment(
      this.code,
      this.title,
      this.batchSize,
      this.expiresAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive payout assignment in status open. */
export function newAdaptivePayoutAssignment(code: string, title: string): AdaptivePayoutAssignment {
  return new AdaptivePayoutAssignment(code, title, 0, 0, 0, "open");
}
