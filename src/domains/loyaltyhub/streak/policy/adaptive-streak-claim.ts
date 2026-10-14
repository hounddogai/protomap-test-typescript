import * as text from "../../../../kit/text.js";

/** Where a adaptive streak claim is in its life cycle. */
export type AdaptiveStreakClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive streak claim and its current status. */
export class AdaptiveStreakClaim {
  code: string;
  label: string;
  batchSize: number;
  ratio: number;
  score: number;
  maximum: number;
  currency: string;
  status: AdaptiveStreakClaimStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    ratio: number,
    score: number,
    maximum: number,
    currency: string,
    status: AdaptiveStreakClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.ratio = ratio;
    this.score = score;
    this.maximum = maximum;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveStreakClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveStreakClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive streak claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.maximum - this.batchSize) * 100) / 100;
  }

  copy(): AdaptiveStreakClaim {
    return new AdaptiveStreakClaim(
      this.code,
      this.label,
      this.batchSize,
      this.ratio,
      this.score,
      this.maximum,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive streak claim in status draft. */
export function newAdaptiveStreakClaim(code: string, label: string): AdaptiveStreakClaim {
  return new AdaptiveStreakClaim(code, label, 0, 0, 0, 0, "", "draft");
}
