import * as text from "../../../../kit/text.js";

/** Where a redemption variance is in its life cycle. */
export type RedemptionVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A redemption variance. Its code is unique within a tenant. */
export class RedemptionVariance {
  code: string;
  name: string;
  notes: string;
  endsAt: number;
  currency: string;
  floorValue: number;
  amount: number;
  clicks: number;
  status: RedemptionVarianceStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    endsAt: number,
    currency: string,
    floorValue: number,
    amount: number,
    clicks: number,
    status: RedemptionVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.endsAt = endsAt;
    this.currency = currency;
    this.floorValue = floorValue;
    this.amount = amount;
    this.clicks = clicks;
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

  canMoveTo(next: RedemptionVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: RedemptionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedLoad(): number {
    return Math.round(this.clicks * this.endsAt * 100) / 100;
  }

  copy(): RedemptionVariance {
    return new RedemptionVariance(
      this.code,
      this.name,
      this.notes,
      this.endsAt,
      this.currency,
      this.floorValue,
      this.amount,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a redemption variance in status idle. */
export function newRedemptionVariance(code: string, name: string): RedemptionVariance {
  return new RedemptionVariance(code, name, "", 0, "", 0, 0, 0, "idle");
}
