import * as text from "../../../../kit/text.js";

/** Where a capped macro estimate is in its life cycle. */
export type CappedMacroEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a capped macro estimate and its current status. */
export class CappedMacroEstimate {
  code: string;
  label: string;
  ceiling: number;
  campaignRef: string;
  cohort: string;
  startsAt: number;
  frequencyCap: number;
  attempts: number;
  status: CappedMacroEstimateStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    campaignRef: string,
    cohort: string,
    startsAt: number,
    frequencyCap: number,
    attempts: number,
    status: CappedMacroEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.startsAt = startsAt;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
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

  canMoveTo(next: CappedMacroEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedMacroEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped macro estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.attempts + this.startsAt) * 100) / 100;
  }

  copy(): CappedMacroEstimate {
    return new CappedMacroEstimate(
      this.code,
      this.label,
      this.ceiling,
      this.campaignRef,
      this.cohort,
      this.startsAt,
      this.frequencyCap,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped macro estimate in status open. */
export function newCappedMacroEstimate(code: string, label: string): CappedMacroEstimate {
  return new CappedMacroEstimate(code, label, 0, "", "", 0, 0, 0, "open");
}
