import * as text from "../../../../kit/text.js";

/** Where a reply allocation is in its life cycle. */
export type ReplyAllocationStatus = "created" | "validated" | "published" | "retired";

/** A reply allocation. Its code is unique within a tenant. */
export class ReplyAllocation {
  code: string;
  label: string;
  batchSize: number;
  createdAt: number;
  source: string;
  expiresAt: number;
  visible: boolean;
  reviewer: string;
  sendAt: number;
  windowDays: number;
  ceiling: number;
  status: ReplyAllocationStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    createdAt: number,
    source: string,
    expiresAt: number,
    visible: boolean,
    reviewer: string,
    sendAt: number,
    windowDays: number,
    ceiling: number,
    status: ReplyAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.source = source;
    this.expiresAt = expiresAt;
    this.visible = visible;
    this.reviewer = reviewer;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.ceiling + this.createdAt) * 100) / 100;
  }

  copy(): ReplyAllocation {
    return new ReplyAllocation(
      this.code,
      this.label,
      this.batchSize,
      this.createdAt,
      this.source,
      this.expiresAt,
      this.visible,
      this.reviewer,
      this.sendAt,
      this.windowDays,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reply allocation in status created. */
export function newReplyAllocation(code: string, label: string): ReplyAllocation {
  return new ReplyAllocation(code, label, 0, 0, "", 0, false, "", 0, 0, 0, "created");
}
