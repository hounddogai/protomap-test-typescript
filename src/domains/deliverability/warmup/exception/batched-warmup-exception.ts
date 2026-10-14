/**
 * The batched warmup exception records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched warmup exception is in its life cycle. */
export type BatchedWarmupExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched warmup exception as the warmup team keeps it. */
export class BatchedWarmupException {
  code: string;
  name: string;
  approved: boolean;
  phone: string;
  audienceId: string;
  score: number;
  status: BatchedWarmupExceptionStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    phone: string,
    audienceId: string,
    score: number,
    status: BatchedWarmupExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.phone = phone;
    this.audienceId = audienceId;
    this.score = score;
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

  canMoveTo(next: BatchedWarmupExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedWarmupExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched warmup exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): BatchedWarmupException {
    return new BatchedWarmupException(
      this.code,
      this.name,
      this.approved,
      this.phone,
      this.audienceId,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched warmup exception in status draft. */
export function newBatchedWarmupException(code: string, name: string): BatchedWarmupException {
  return new BatchedWarmupException(code, name, false, "", "", 0, "draft");
}
