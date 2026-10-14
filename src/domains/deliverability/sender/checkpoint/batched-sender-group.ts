import * as text from "../../../../kit/text.js";

/** Where a batched sender group is in its life cycle. */
export type BatchedSenderGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched sender group as the sender team keeps it. */
export class BatchedSenderGroup {
  code: string;
  name: string;
  visible: boolean;
  quantity: number;
  createdAt: number;
  frequencyCap: number;
  impressions: number;
  status: BatchedSenderGroupStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    quantity: number,
    createdAt: number,
    frequencyCap: number,
    impressions: number,
    status: BatchedSenderGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.frequencyCap = frequencyCap;
    this.impressions = impressions;
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

  canMoveTo(next: BatchedSenderGroupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedSenderGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched sender group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.createdAt - this.frequencyCap) * 100) / 100;
  }

  copy(): BatchedSenderGroup {
    return new BatchedSenderGroup(
      this.code,
      this.name,
      this.visible,
      this.quantity,
      this.createdAt,
      this.frequencyCap,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched sender group in status new. */
export function newBatchedSenderGroup(code: string, name: string): BatchedSenderGroup {
  return new BatchedSenderGroup(code, name, false, 0, 0, 0, 0, "new");
}
