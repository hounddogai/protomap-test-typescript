import * as text from "../../../../kit/text.js";

/** Where a batched tier group is in its life cycle. */
export type BatchedTierGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched tier group as the tier team keeps it. */
export class BatchedTierGroup {
  code: string;
  title: string;
  sendAt: number;
  endsAt: number;
  openRate: number;
  status: BatchedTierGroupStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    endsAt: number,
    openRate: number,
    status: BatchedTierGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.openRate = openRate;
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

  canMoveTo(next: BatchedTierGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedTierGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched tier group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round(this.endsAt * this.openRate * 100) / 100;
  }

  copy(): BatchedTierGroup {
    return new BatchedTierGroup(this.code, this.title, this.sendAt, this.endsAt, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched tier group in status idle. */
export function newBatchedTierGroup(code: string, title: string): BatchedTierGroup {
  return new BatchedTierGroup(code, title, 0, 0, 0, "idle");
}
