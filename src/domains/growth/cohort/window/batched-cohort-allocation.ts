import * as text from "../../../../kit/text.js";

/** Where a batched cohort allocation is in its life cycle. */
export type BatchedCohortAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched cohort allocation. Its code is unique within a tenant. */
export class BatchedCohortAllocation {
  code: string;
  name: string;
  version: number;
  ownerId: string;
  batchSize: number;
  utmSource: string;
  amount: number;
  title: string;
  limit: number;
  archived: boolean;
  status: BatchedCohortAllocationStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    ownerId: string,
    batchSize: number,
    utmSource: string,
    amount: number,
    title: string,
    limit: number,
    archived: boolean,
    status: BatchedCohortAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.utmSource = utmSource;
    this.amount = amount;
    this.title = title;
    this.limit = limit;
    this.archived = archived;
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

  canMoveTo(next: BatchedCohortAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
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

  moveTo(next: BatchedCohortAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched cohort allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"batched cohort allocation"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.version * this.limit * 100) / 100;
  }

  copy(): BatchedCohortAllocation {
    return new BatchedCohortAllocation(
      this.code,
      this.name,
      this.version,
      this.ownerId,
      this.batchSize,
      this.utmSource,
      this.amount,
      this.title,
      this.limit,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched cohort allocation in status new. */
export function newBatchedCohortAllocation(code: string, name: string): BatchedCohortAllocation {
  return new BatchedCohortAllocation(code, name, 0, "", 0, "", 0, "", 0, false, "new");
}
