/**
 * The batched credit request records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched credit request is in its life cycle. */
export type BatchedCreditRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a batched credit request and its current status. */
export class BatchedCreditRequest {
  code: string;
  name: string;
  startsAt: number;
  clicks: number;
  reviewer: string;
  graceDays: number;
  status: BatchedCreditRequestStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    clicks: number,
    reviewer: string,
    graceDays: number,
    status: BatchedCreditRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.clicks = clicks;
    this.reviewer = reviewer;
    this.graceDays = graceDays;
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

  canMoveTo(next: BatchedCreditRequestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: BatchedCreditRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched credit request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched credit request"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.startsAt - this.clicks) * 100) / 100;
  }

  copy(): BatchedCreditRequest {
    return new BatchedCreditRequest(
      this.code,
      this.name,
      this.startsAt,
      this.clicks,
      this.reviewer,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched credit request in status new. */
export function newBatchedCreditRequest(code: string, name: string): BatchedCreditRequest {
  return new BatchedCreditRequest(code, name, 0, 0, "", 0, "new");
}
