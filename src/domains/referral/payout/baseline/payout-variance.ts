import * as text from "../../../../kit/text.js";

/** Where a payout variance is in its life cycle. */
export type PayoutVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A payout variance. Its code is unique within a tenant. */
export class PayoutVariance {
  code: string;
  title: string;
  checksum: string;
  expiresAt: number;
  threshold: number;
  status: PayoutVarianceStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    expiresAt: number,
    threshold: number,
    status: PayoutVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.expiresAt = expiresAt;
    this.threshold = threshold;
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

  canMoveTo(next: PayoutVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.expiresAt + this.threshold) * 100) / 100;
  }

  copy(): PayoutVariance {
    return new PayoutVariance(this.code, this.title, this.checksum, this.expiresAt, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a payout variance in status new. */
export function newPayoutVariance(code: string, title: string): PayoutVariance {
  return new PayoutVariance(code, title, "", 0, 0, "new");
}
