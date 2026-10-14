import * as text from "../../../../kit/text.js";

/** Where a adaptive nudge estimate is in its life cycle. */
export type AdaptiveNudgeEstimateStatus = "created" | "validated" | "published" | "retired";

/** A adaptive nudge estimate. Its code is unique within a tenant. */
export class AdaptiveNudgeEstimate {
  code: string;
  label: string;
  conversionRate: number;
  region: string;
  createdAt: number;
  externalRef: string;
  cost: number;
  weight: number;
  source: string;
  checksum: string;
  amount: number;
  status: AdaptiveNudgeEstimateStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    region: string,
    createdAt: number,
    externalRef: string,
    cost: number,
    weight: number,
    source: string,
    checksum: string,
    amount: number,
    status: AdaptiveNudgeEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.region = region;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.cost = cost;
    this.weight = weight;
    this.source = source;
    this.checksum = checksum;
    this.amount = amount;
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

  canMoveTo(next: AdaptiveNudgeEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveNudgeEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive nudge estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"adaptive nudge estimate"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.amount * this.weight * 100) / 100;
  }

  copy(): AdaptiveNudgeEstimate {
    return new AdaptiveNudgeEstimate(
      this.code,
      this.label,
      this.conversionRate,
      this.region,
      this.createdAt,
      this.externalRef,
      this.cost,
      this.weight,
      this.source,
      this.checksum,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive nudge estimate in status created. */
export function newAdaptiveNudgeEstimate(code: string, label: string): AdaptiveNudgeEstimate {
  return new AdaptiveNudgeEstimate(code, label, 0, "", 0, "", 0, 0, "", "", 0, "created");
}
