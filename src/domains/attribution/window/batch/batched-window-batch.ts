/**
 * The batched window batch records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched window batch is in its life cycle. */
export type BatchedWindowBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One batched window batch, with what the planners need to act on it. */
export class BatchedWindowBatch {
  code: string;
  label: string;
  discount: number;
  quantity: number;
  sequence: number;
  tags: string[];
  archived: boolean;
  journeyId: string;
  status: BatchedWindowBatchStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    quantity: number,
    sequence: number,
    tags: string[],
    archived: boolean,
    journeyId: string,
    status: BatchedWindowBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.quantity = quantity;
    this.sequence = sequence;
    this.tags = tags;
    this.archived = archived;
    this.journeyId = journeyId;
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

  canMoveTo(next: BatchedWindowBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedWindowBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched window batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round((this.sequence - this.discount) * 100) / 100;
  }

  copy(): BatchedWindowBatch {
    return new BatchedWindowBatch(
      this.code,
      this.label,
      this.discount,
      this.quantity,
      this.sequence,
      this.tags,
      this.archived,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched window batch in status idle. */
export function newBatchedWindowBatch(code: string, label: string): BatchedWindowBatch {
  return new BatchedWindowBatch(code, label, 0, 0, 0, [], false, "", "idle");
}
