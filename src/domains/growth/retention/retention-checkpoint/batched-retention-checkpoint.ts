/**
 * The batched retention checkpoint records of growth's retention work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched retention checkpoint is in its life cycle. */
export type BatchedRetentionCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One batched retention checkpoint, with what the planners need to act on it. */
export class BatchedRetentionCheckpoint {
  code: string;
  label: string;
  rate: number;
  channel: string;
  notes: string;
  status: BatchedRetentionCheckpointStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    channel: string,
    notes: string,
    status: BatchedRetentionCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.channel = channel;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedRetentionCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedRetentionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched retention checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched retention checkpoint"} ${this.code}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): BatchedRetentionCheckpoint {
    return new BatchedRetentionCheckpoint(this.code, this.label, this.rate, this.channel, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched retention checkpoint in status draft. */
export function newBatchedRetentionCheckpoint(code: string, label: string): BatchedRetentionCheckpoint {
  return new BatchedRetentionCheckpoint(code, label, 0, "", "", "draft");
}
