import * as text from "../../../../kit/text.js";

/** Where a sender notice is in its life cycle. */
export type SenderNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a sender notice and its current status. */
export class SenderNotice {
  code: string;
  title: string;
  createdAt: number;
  capacity: number;
  reviewer: string;
  unit: string;
  status: SenderNoticeStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    capacity: number,
    reviewer: string,
    unit: string,
    status: SenderNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.capacity = capacity;
    this.reviewer = reviewer;
    this.unit = unit;
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

  canMoveTo(next: SenderNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SenderNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"sender notice"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.createdAt + this.capacity) * 100) / 100;
  }

  copy(): SenderNotice {
    return new SenderNotice(
      this.code,
      this.title,
      this.createdAt,
      this.capacity,
      this.reviewer,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a sender notice in status draft. */
export function newSenderNotice(code: string, title: string): SenderNotice {
  return new SenderNotice(code, title, 0, 0, "", "", "draft");
}
