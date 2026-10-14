/**
 * The batched post milestone records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched post milestone is in its life cycle. */
export type BatchedPostMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A batched post milestone as the post team keeps it. */
export class BatchedPostMilestone {
  code: string;
  name: string;
  sendAt: number;
  summary: string;
  quantity: number;
  status: BatchedPostMilestoneStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    summary: string,
    quantity: number,
    status: BatchedPostMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.summary = summary;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedPostMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedPostMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched post milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched post milestone"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.quantity - this.sendAt) * 100) / 100;
  }

  copy(): BatchedPostMilestone {
    return new BatchedPostMilestone(this.code, this.name, this.sendAt, this.summary, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched post milestone in status requested. */
export function newBatchedPostMilestone(code: string, name: string): BatchedPostMilestone {
  return new BatchedPostMilestone(code, name, 0, "", 0, "requested");
}
