import * as text from "../../../../kit/text.js";

/** Where a batched window checkpoint is in its life cycle. */
export type BatchedWindowCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched window checkpoint as the window team keeps it. */
export class BatchedWindowCheckpoint {
  code: string;
  title: string;
  attempts: number;
  campaignRef: string;
  bid: number;
  batchSize: number;
  sendAt: number;
  capacity: number;
  approved: boolean;
  openRate: number;
  status: BatchedWindowCheckpointStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    campaignRef: string,
    bid: number,
    batchSize: number,
    sendAt: number,
    capacity: number,
    approved: boolean,
    openRate: number,
    status: BatchedWindowCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.bid = bid;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
    this.capacity = capacity;
    this.approved = approved;
    this.openRate = openRate;
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

  canMoveTo(next: BatchedWindowCheckpointStatus): boolean {
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
          case "done":
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

  moveTo(next: BatchedWindowCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched window checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.bid - this.capacity) * 100) / 100;
  }

  copy(): BatchedWindowCheckpoint {
    return new BatchedWindowCheckpoint(
      this.code,
      this.title,
      this.attempts,
      this.campaignRef,
      this.bid,
      this.batchSize,
      this.sendAt,
      this.capacity,
      this.approved,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched window checkpoint in status new. */
export function newBatchedWindowCheckpoint(code: string, title: string): BatchedWindowCheckpoint {
  return new BatchedWindowCheckpoint(code, title, 0, "", 0, 0, 0, 0, false, 0, "new");
}
