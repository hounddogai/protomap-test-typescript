import * as text from "../../../../kit/text.js";

/** Where a reply snapshot is in its life cycle. */
export type ReplySnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reply snapshot. Its code is unique within a tenant. */
export class ReplySnapshot {
  code: string;
  title: string;
  windowDays: number;
  bid: number;
  createdAt: number;
  durationMinutes: number;
  cost: number;
  status: ReplySnapshotStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    bid: number,
    createdAt: number,
    durationMinutes: number,
    cost: number,
    status: ReplySnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.bid = bid;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplySnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ReplySnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.cost - this.bid) * 100) / 100;
  }

  copy(): ReplySnapshot {
    return new ReplySnapshot(
      this.code,
      this.title,
      this.windowDays,
      this.bid,
      this.createdAt,
      this.durationMinutes,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reply snapshot in status proposed. */
export function newReplySnapshot(code: string, title: string): ReplySnapshot {
  return new ReplySnapshot(code, title, 0, 0, 0, 0, 0, "proposed");
}
