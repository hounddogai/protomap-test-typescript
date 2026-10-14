import * as text from "../../../../kit/text.js";

/** Where a batched tier allocation is in its life cycle. */
export type BatchedTierAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched tier allocation, with what the planners need to act on it. */
export class BatchedTierAllocation {
  code: string;
  name: string;
  maximum: number;
  limit: number;
  ratio: number;
  durationMinutes: number;
  country: string;
  amount: number;
  currency: string;
  ceiling: number;
  status: BatchedTierAllocationStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    limit: number,
    ratio: number,
    durationMinutes: number,
    country: string,
    amount: number,
    currency: string,
    ceiling: number,
    status: BatchedTierAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.limit = limit;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.country = country;
    this.amount = amount;
    this.currency = currency;
    this.ceiling = ceiling;
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

  canMoveTo(next: BatchedTierAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedTierAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched tier allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched tier allocation"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.limit + this.maximum) * 100) / 100;
  }

  copy(): BatchedTierAllocation {
    return new BatchedTierAllocation(
      this.code,
      this.name,
      this.maximum,
      this.limit,
      this.ratio,
      this.durationMinutes,
      this.country,
      this.amount,
      this.currency,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched tier allocation in status new. */
export function newBatchedTierAllocation(code: string, name: string): BatchedTierAllocation {
  return new BatchedTierAllocation(code, name, 0, 0, 0, 0, "", 0, "", 0, "new");
}
