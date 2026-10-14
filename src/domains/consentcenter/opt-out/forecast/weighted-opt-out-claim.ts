import * as text from "../../../../kit/text.js";

/** Where a weighted opt out claim is in its life cycle. */
export type WeightedOptOutClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a weighted opt out claim and its current status. */
export class WeightedOptOutClaim {
  code: string;
  name: string;
  ceiling: number;
  segment: string;
  quantity: number;
  timezone: string;
  cohort: string;
  checksum: string;
  amount: number;
  status: WeightedOptOutClaimStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    segment: string,
    quantity: number,
    timezone: string,
    cohort: string,
    checksum: string,
    amount: number,
    status: WeightedOptOutClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.segment = segment;
    this.quantity = quantity;
    this.timezone = timezone;
    this.cohort = cohort;
    this.checksum = checksum;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedOptOutClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedOptOutClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted opt out claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round(this.quantity * this.ceiling * 100) / 100;
  }

  copy(): WeightedOptOutClaim {
    return new WeightedOptOutClaim(
      this.code,
      this.name,
      this.ceiling,
      this.segment,
      this.quantity,
      this.timezone,
      this.cohort,
      this.checksum,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted opt out claim in status planned. */
export function newWeightedOptOutClaim(code: string, name: string): WeightedOptOutClaim {
  return new WeightedOptOutClaim(code, name, 0, "", 0, "", "", "", 0, "planned");
}
