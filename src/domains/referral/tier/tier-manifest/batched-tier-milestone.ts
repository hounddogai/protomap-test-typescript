import * as text from "../../../../kit/text.js";

/** Where a batched tier milestone is in its life cycle. */
export type BatchedTierMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched tier milestone, with what the planners need to act on it. */
export class BatchedTierMilestone {
  code: string;
  title: string;
  impressions: number;
  sendAt: number;
  ownerId: string;
  discount: number;
  budget: number;
  updatedAt: number;
  description: string;
  summary: string;
  retries: number;
  status: BatchedTierMilestoneStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    sendAt: number,
    ownerId: string,
    discount: number,
    budget: number,
    updatedAt: number,
    description: string,
    summary: string,
    retries: number,
    status: BatchedTierMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.sendAt = sendAt;
    this.ownerId = ownerId;
    this.discount = discount;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.description = description;
    this.summary = summary;
    this.retries = retries;
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

  canMoveTo(next: BatchedTierMilestoneStatus): boolean {
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
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: BatchedTierMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched tier milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.discount + this.retries) * 100) / 100;
  }

  copy(): BatchedTierMilestone {
    return new BatchedTierMilestone(
      this.code,
      this.title,
      this.impressions,
      this.sendAt,
      this.ownerId,
      this.discount,
      this.budget,
      this.updatedAt,
      this.description,
      this.summary,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched tier milestone in status new. */
export function newBatchedTierMilestone(code: string, title: string): BatchedTierMilestone {
  return new BatchedTierMilestone(code, title, 0, 0, "", 0, 0, 0, "", "", 0, "new");
}
