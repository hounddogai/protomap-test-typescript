import * as text from "../../../../kit/text.js";

/** Where a branch allocation is in its life cycle. */
export type BranchAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A branch allocation as the branch team keeps it. */
export class BranchAllocation {
  code: string;
  name: string;
  quantity: number;
  limit: number;
  variant: string;
  updatedAt: number;
  weight: number;
  category: string;
  status: BranchAllocationStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    limit: number,
    variant: string,
    updatedAt: number,
    weight: number,
    category: string,
    status: BranchAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.limit = limit;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.weight = weight;
    this.category = category;
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

  canMoveTo(next: BranchAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
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

  moveTo(next: BranchAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.quantity - this.weight) * 100) / 100;
  }

  copy(): BranchAllocation {
    return new BranchAllocation(
      this.code,
      this.name,
      this.quantity,
      this.limit,
      this.variant,
      this.updatedAt,
      this.weight,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a branch allocation in status new. */
export function newBranchAllocation(code: string, name: string): BranchAllocation {
  return new BranchAllocation(code, name, 0, 0, "", 0, 0, "", "new");
}
