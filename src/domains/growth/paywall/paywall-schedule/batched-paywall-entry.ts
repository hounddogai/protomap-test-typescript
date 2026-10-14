import * as text from "../../../../kit/text.js";

/** Where a batched paywall entry is in its life cycle. */
export type BatchedPaywallEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched paywall entry as the paywall team keeps it. */
export class BatchedPaywallEntry {
  code: string;
  name: string;
  minimum: number;
  active: boolean;
  batchSize: number;
  source: string;
  reviewer: string;
  attempts: number;
  clicks: number;
  status: BatchedPaywallEntryStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    active: boolean,
    batchSize: number,
    source: string,
    reviewer: string,
    attempts: number,
    clicks: number,
    status: BatchedPaywallEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.active = active;
    this.batchSize = batchSize;
    this.source = source;
    this.reviewer = reviewer;
    this.attempts = attempts;
    this.clicks = clicks;
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

  canMoveTo(next: BatchedPaywallEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedPaywallEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched paywall entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.batchSize - this.minimum) * 100) / 100;
  }

  copy(): BatchedPaywallEntry {
    return new BatchedPaywallEntry(
      this.code,
      this.name,
      this.minimum,
      this.active,
      this.batchSize,
      this.source,
      this.reviewer,
      this.attempts,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched paywall entry in status idle. */
export function newBatchedPaywallEntry(code: string, name: string): BatchedPaywallEntry {
  return new BatchedPaywallEntry(code, name, 0, false, 0, "", "", 0, 0, "idle");
}
