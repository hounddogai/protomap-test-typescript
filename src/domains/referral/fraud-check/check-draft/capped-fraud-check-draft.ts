/**
 * The capped fraud check draft records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped fraud check draft is in its life cycle. */
export type CappedFraudCheckDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a capped fraud check draft and its current status. */
export class CappedFraudCheckDraft {
  code: string;
  label: string;
  ratio: number;
  journeyId: string;
  timezone: string;
  budget: number;
  status: CappedFraudCheckDraftStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    journeyId: string,
    timezone: string,
    budget: number,
    status: CappedFraudCheckDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.timezone = timezone;
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

  canMoveTo(next: CappedFraudCheckDraftStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
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

  moveTo(next: CappedFraudCheckDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped fraud check draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped fraud check draft"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.ratio + this.budget) * 100) / 100;
  }

  copy(): CappedFraudCheckDraft {
    return new CappedFraudCheckDraft(
      this.code,
      this.label,
      this.ratio,
      this.journeyId,
      this.timezone,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped fraud check draft in status open. */
export function newCappedFraudCheckDraft(code: string, label: string): CappedFraudCheckDraft {
  return new CappedFraudCheckDraft(code, label, 0, "", "", 0, "open");
}
