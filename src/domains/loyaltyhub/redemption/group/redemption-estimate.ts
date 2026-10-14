import * as text from "../../../../kit/text.js";

/** Where a redemption estimate is in its life cycle. */
export type RedemptionEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** One redemption estimate, with what the planners need to act on it. */
export class RedemptionEstimate {
  code: string;
  label: string;
  budget: number;
  sequence: number;
  audienceId: string;
  currency: string;
  status: RedemptionEstimateStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    sequence: number,
    audienceId: string,
    currency: string,
    status: RedemptionEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"redemption estimate"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.sequence + this.budget) * 100) / 100;
  }

  copy(): RedemptionEstimate {
    return new RedemptionEstimate(
      this.code,
      this.label,
      this.budget,
      this.sequence,
      this.audienceId,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption estimate in status new. */
export function newRedemptionEstimate(code: string, label: string): RedemptionEstimate {
  return new RedemptionEstimate(code, label, 0, 0, "", "", "new");
}
