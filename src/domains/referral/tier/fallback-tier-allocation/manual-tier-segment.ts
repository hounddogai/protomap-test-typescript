import * as text from "../../../../kit/text.js";

/** Where a manual tier segment is in its life cycle. */
export type ManualTierSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual tier segment. Its code is unique within a tenant. */
export class ManualTierSegment {
  code: string;
  title: string;
  graceDays: number;
  capacity: number;
  currency: string;
  createdAt: number;
  priority: number;
  windowDays: number;
  status: ManualTierSegmentStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    capacity: number,
    currency: string,
    createdAt: number,
    priority: number,
    windowDays: number,
    status: ManualTierSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.capacity = capacity;
    this.currency = currency;
    this.createdAt = createdAt;
    this.priority = priority;
    this.windowDays = windowDays;
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

  canMoveTo(next: ManualTierSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualTierSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual tier segment"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.graceDays + this.createdAt) * 100) / 100;
  }

  copy(): ManualTierSegment {
    return new ManualTierSegment(
      this.code,
      this.title,
      this.graceDays,
      this.capacity,
      this.currency,
      this.createdAt,
      this.priority,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual tier segment in status draft. */
export function newManualTierSegment(code: string, title: string): ManualTierSegment {
  return new ManualTierSegment(code, title, 0, 0, "", 0, 0, 0, "draft");
}
