import * as text from "../../../../kit/text.js";

/** Where a proof threshold is in its life cycle. */
export type ProofThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A proof threshold as the proof team keeps it. */
export class ProofThreshold {
  code: string;
  label: string;
  notes: string;
  clicks: number;
  amount: number;
  pinned: boolean;
  cohort: string;
  batchSize: number;
  timezone: string;
  status: ProofThresholdStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    clicks: number,
    amount: number,
    pinned: boolean,
    cohort: string,
    batchSize: number,
    timezone: string,
    status: ProofThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.clicks = clicks;
    this.amount = amount;
    this.pinned = pinned;
    this.cohort = cohort;
    this.batchSize = batchSize;
    this.timezone = timezone;
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

  canMoveTo(next: ProofThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ProofThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"proof threshold"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.amount - this.batchSize) * 100) / 100;
  }

  copy(): ProofThreshold {
    return new ProofThreshold(
      this.code,
      this.label,
      this.notes,
      this.clicks,
      this.amount,
      this.pinned,
      this.cohort,
      this.batchSize,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a proof threshold in status open. */
export function newProofThreshold(code: string, label: string): ProofThreshold {
  return new ProofThreshold(code, label, "", 0, 0, false, "", 0, "", "open");
}
