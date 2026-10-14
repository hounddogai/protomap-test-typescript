import * as text from "../../../../kit/text.js";

/** Where a batched wait baseline is in its life cycle. */
export type BatchedWaitBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched wait baseline. Its code is unique within a tenant. */
export class BatchedWaitBaseline {
  code: string;
  label: string;
  timezone: string;
  source: string;
  quantity: number;
  status: BatchedWaitBaselineStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    source: string,
    quantity: number,
    status: BatchedWaitBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.source = source;
    this.quantity = quantity;
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

  canMoveTo(next: BatchedWaitBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedWaitBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched wait baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): BatchedWaitBaseline {
    return new BatchedWaitBaseline(this.code, this.label, this.timezone, this.source, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched wait baseline in status idle. */
export function newBatchedWaitBaseline(code: string, label: string): BatchedWaitBaseline {
  return new BatchedWaitBaseline(code, label, "", "", 0, "idle");
}
