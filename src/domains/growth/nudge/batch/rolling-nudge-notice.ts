import * as text from "../../../../kit/text.js";

/** Where a rolling nudge notice is in its life cycle. */
export type RollingNudgeNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling nudge notice as the nudge team keeps it. */
export class RollingNudgeNotice {
  code: string;
  title: string;
  amount: number;
  margin: number;
  impressions: number;
  capacity: number;
  createdAt: number;
  phone: string;
  status: RollingNudgeNoticeStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    margin: number,
    impressions: number,
    capacity: number,
    createdAt: number,
    phone: string,
    status: RollingNudgeNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.margin = margin;
    this.impressions = impressions;
    this.capacity = capacity;
    this.createdAt = createdAt;
    this.phone = phone;
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

  canMoveTo(next: RollingNudgeNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingNudgeNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedTotal(): number {
    return Math.round((this.impressions - this.margin) * 100) / 100;
  }

  copy(): RollingNudgeNotice {
    return new RollingNudgeNotice(
      this.code,
      this.title,
      this.amount,
      this.margin,
      this.impressions,
      this.capacity,
      this.createdAt,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling nudge notice in status idle. */
export function newRollingNudgeNotice(code: string, title: string): RollingNudgeNotice {
  return new RollingNudgeNotice(code, title, 0, 0, 0, 0, 0, "", "idle");
}
