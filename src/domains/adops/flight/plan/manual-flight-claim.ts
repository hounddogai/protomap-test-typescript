import * as text from "../../../../kit/text.js";

/** Where a manual flight claim is in its life cycle. */
export type ManualFlightClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One manual flight claim, with what the planners need to act on it. */
export class ManualFlightClaim {
  code: string;
  name: string;
  segment: string;
  updatedAt: number;
  discount: number;
  tags: string[];
  amount: number;
  rate: number;
  conversionRate: number;
  priority: number;
  status: ManualFlightClaimStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    updatedAt: number,
    discount: number,
    tags: string[],
    amount: number,
    rate: number,
    conversionRate: number,
    priority: number,
    status: ManualFlightClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.updatedAt = updatedAt;
    this.discount = discount;
    this.tags = tags;
    this.amount = amount;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.priority = priority;
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

  canMoveTo(next: ManualFlightClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualFlightClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual flight claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.amount + this.rate) * 100) / 100;
  }

  copy(): ManualFlightClaim {
    return new ManualFlightClaim(
      this.code,
      this.name,
      this.segment,
      this.updatedAt,
      this.discount,
      this.tags,
      this.amount,
      this.rate,
      this.conversionRate,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual flight claim in status idle. */
export function newManualFlightClaim(code: string, name: string): ManualFlightClaim {
  return new ManualFlightClaim(code, name, "", 0, 0, [], 0, 0, 0, 0, "idle");
}
