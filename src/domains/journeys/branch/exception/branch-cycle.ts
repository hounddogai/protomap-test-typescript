import * as text from "../../../../kit/text.js";

/** Where a branch cycle is in its life cycle. */
export type BranchCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A branch cycle. Its code is unique within a tenant. */
export class BranchCycle {
  code: string;
  title: string;
  windowDays: number;
  minimum: number;
  amount: number;
  limit: number;
  threshold: number;
  ceiling: number;
  status: BranchCycleStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    minimum: number,
    amount: number,
    limit: number,
    threshold: number,
    ceiling: number,
    status: BranchCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.minimum = minimum;
    this.amount = amount;
    this.limit = limit;
    this.threshold = threshold;
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

  canMoveTo(next: BranchCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
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
        switch (next) {
          case "done":
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

  moveTo(next: BranchCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.limit + this.threshold) * 100) / 100;
  }

  copy(): BranchCycle {
    return new BranchCycle(
      this.code,
      this.title,
      this.windowDays,
      this.minimum,
      this.amount,
      this.limit,
      this.threshold,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a branch cycle in status new. */
export function newBranchCycle(code: string, title: string): BranchCycle {
  return new BranchCycle(code, title, 0, 0, 0, 0, 0, 0, "new");
}
