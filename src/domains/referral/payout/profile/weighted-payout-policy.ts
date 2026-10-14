import * as text from "../../../../kit/text.js";

/** Where a weighted payout policy is in its life cycle. */
export type WeightedPayoutPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted payout policy as the payout team keeps it. */
export class WeightedPayoutPolicy {
  code: string;
  title: string;
  windowDays: number;
  batchSize: number;
  currency: string;
  capacity: number;
  audienceId: string;
  frequencyCap: number;
  checksum: string;
  status: WeightedPayoutPolicyStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    batchSize: number,
    currency: string,
    capacity: number,
    audienceId: string,
    frequencyCap: number,
    checksum: string,
    status: WeightedPayoutPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.currency = currency;
    this.capacity = capacity;
    this.audienceId = audienceId;
    this.frequencyCap = frequencyCap;
    this.checksum = checksum;
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

  canMoveTo(next: WeightedPayoutPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPayoutPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted payout policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.frequencyCap + this.capacity) * 100) / 100;
  }

  copy(): WeightedPayoutPolicy {
    return new WeightedPayoutPolicy(
      this.code,
      this.title,
      this.windowDays,
      this.batchSize,
      this.currency,
      this.capacity,
      this.audienceId,
      this.frequencyCap,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted payout policy in status proposed. */
export function newWeightedPayoutPolicy(code: string, title: string): WeightedPayoutPolicy {
  return new WeightedPayoutPolicy(code, title, 0, 0, "", 0, "", 0, "", "proposed");
}
