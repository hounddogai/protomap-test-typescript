/**
 * The retention score records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention score is in its life cycle. */
export type RetentionScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One retention score, with what the planners need to act on it. */
export class RetentionScore {
  code: string;
  label: string;
  endsAt: number;
  source: string;
  attempts: number;
  status: RetentionScoreStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    source: string,
    attempts: number,
    status: RetentionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.source = source;
    this.attempts = attempts;
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

  canMoveTo(next: RetentionScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"retention score"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.endsAt - this.attempts) * 100) / 100;
  }

  copy(): RetentionScore {
    return new RetentionScore(this.code, this.label, this.endsAt, this.source, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a retention score in status proposed. */
export function newRetentionScore(code: string, label: string): RetentionScore {
  return new RetentionScore(code, label, 0, "", 0, "proposed");
}
