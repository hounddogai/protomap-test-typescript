import * as text from "../../../../kit/text.js";

/** Where a batched level request is in its life cycle. */
export type BatchedLevelRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched level request. Its code is unique within a tenant. */
export class BatchedLevelRequest {
  code: string;
  title: string;
  discount: number;
  revision: number;
  quantity: number;
  reviewer: string;
  clicks: number;
  status: BatchedLevelRequestStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    revision: number,
    quantity: number,
    reviewer: string,
    clicks: number,
    status: BatchedLevelRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.revision = revision;
    this.quantity = quantity;
    this.reviewer = reviewer;
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

  canMoveTo(next: BatchedLevelRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
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

  moveTo(next: BatchedLevelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched level request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"batched level request"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.revision * this.quantity * 100) / 100;
  }

  copy(): BatchedLevelRequest {
    return new BatchedLevelRequest(
      this.code,
      this.title,
      this.discount,
      this.revision,
      this.quantity,
      this.reviewer,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched level request in status idle. */
export function newBatchedLevelRequest(code: string, title: string): BatchedLevelRequest {
  return new BatchedLevelRequest(code, title, 0, 0, 0, "", 0, "idle");
}
