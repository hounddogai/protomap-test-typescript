import * as text from "../../../../kit/text.js";

/** Where a batched warmup ledger is in its life cycle. */
export type BatchedWarmupLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a batched warmup ledger and its current status. */
export class BatchedWarmupLedger {
  code: string;
  title: string;
  threshold: number;
  cohort: string;
  batchSize: number;
  createdAt: number;
  checksum: string;
  tags: string[];
  status: BatchedWarmupLedgerStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    cohort: string,
    batchSize: number,
    createdAt: number,
    checksum: string,
    tags: string[],
    status: BatchedWarmupLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.cohort = cohort;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.checksum = checksum;
    this.tags = tags;
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

  canMoveTo(next: BatchedWarmupLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedWarmupLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched warmup ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched warmup ledger"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round((this.createdAt + this.threshold) * 100) / 100;
  }

  copy(): BatchedWarmupLedger {
    return new BatchedWarmupLedger(
      this.code,
      this.title,
      this.threshold,
      this.cohort,
      this.batchSize,
      this.createdAt,
      this.checksum,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched warmup ledger in status planned. */
export function newBatchedWarmupLedger(code: string, title: string): BatchedWarmupLedger {
  return new BatchedWarmupLedger(code, title, 0, "", 0, 0, "", [], "planned");
}
