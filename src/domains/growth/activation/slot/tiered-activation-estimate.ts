import * as text from "../../../../kit/text.js";

/** Where a tiered activation estimate is in its life cycle. */
export type TieredActivationEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered activation estimate as the activation team keeps it. */
export class TieredActivationEstimate {
  code: string;
  name: string;
  bid: number;
  budget: number;
  unit: string;
  status: TieredActivationEstimateStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    budget: number,
    unit: string,
    status: TieredActivationEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.budget = budget;
    this.unit = unit;
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

  canMoveTo(next: TieredActivationEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredActivationEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered activation estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered activation estimate"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.budget - this.bid) * 100) / 100;
  }

  copy(): TieredActivationEstimate {
    return new TieredActivationEstimate(this.code, this.name, this.bid, this.budget, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered activation estimate in status new. */
export function newTieredActivationEstimate(code: string, name: string): TieredActivationEstimate {
  return new TieredActivationEstimate(code, name, 0, 0, "", "new");
}
