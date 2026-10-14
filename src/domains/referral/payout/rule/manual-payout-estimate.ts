import * as text from "../../../../kit/text.js";

/** Where a manual payout estimate is in its life cycle. */
export type ManualPayoutEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual payout estimate. Its code is unique within a tenant. */
export class ManualPayoutEstimate {
  code: string;
  label: string;
  score: number;
  journeyId: string;
  country: string;
  frequencyCap: number;
  conversionRate: number;
  status: ManualPayoutEstimateStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    journeyId: string,
    country: string,
    frequencyCap: number,
    conversionRate: number,
    status: ManualPayoutEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.journeyId = journeyId;
    this.country = country;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualPayoutEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPayoutEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual payout estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveVolume(): number {
    return Math.round((this.frequencyCap + this.conversionRate) * 100) / 100;
  }

  copy(): ManualPayoutEstimate {
    return new ManualPayoutEstimate(
      this.code,
      this.label,
      this.score,
      this.journeyId,
      this.country,
      this.frequencyCap,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual payout estimate in status idle. */
export function newManualPayoutEstimate(code: string, label: string): ManualPayoutEstimate {
  return new ManualPayoutEstimate(code, label, 0, "", "", 0, 0, "idle");
}
