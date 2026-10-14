import * as text from "../../../../kit/text.js";

/** Where a batched invite notice is in its life cycle. */
export type BatchedInviteNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a batched invite notice and its current status. */
export class BatchedInviteNotice {
  code: string;
  name: string;
  batchSize: number;
  createdAt: number;
  sendAt: number;
  quantity: number;
  source: string;
  status: BatchedInviteNoticeStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    createdAt: number,
    sendAt: number,
    quantity: number,
    source: string,
    status: BatchedInviteNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.sendAt = sendAt;
    this.quantity = quantity;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedInviteNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedInviteNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched invite notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched invite notice"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.quantity + this.sendAt) * 100) / 100;
  }

  copy(): BatchedInviteNotice {
    return new BatchedInviteNotice(
      this.code,
      this.name,
      this.batchSize,
      this.createdAt,
      this.sendAt,
      this.quantity,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched invite notice in status open. */
export function newBatchedInviteNotice(code: string, name: string): BatchedInviteNotice {
  return new BatchedInviteNotice(code, name, 0, 0, 0, 0, "", "open");
}
