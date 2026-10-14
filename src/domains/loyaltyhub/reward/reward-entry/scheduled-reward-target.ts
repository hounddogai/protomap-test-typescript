import * as text from "../../../../kit/text.js";

/** Where a scheduled reward target is in its life cycle. */
export type ScheduledRewardTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled reward target. Its code is unique within a tenant. */
export class ScheduledRewardTarget {
  code: string;
  title: string;
  quantity: number;
  graceDays: number;
  locale: string;
  createdAt: number;
  ownerId: string;
  active: boolean;
  status: ScheduledRewardTargetStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    graceDays: number,
    locale: string,
    createdAt: number,
    ownerId: string,
    active: boolean,
    status: ScheduledRewardTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.graceDays = graceDays;
    this.locale = locale;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledRewardTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledRewardTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reward target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.graceDays - this.createdAt) * 100) / 100;
  }

  copy(): ScheduledRewardTarget {
    return new ScheduledRewardTarget(
      this.code,
      this.title,
      this.quantity,
      this.graceDays,
      this.locale,
      this.createdAt,
      this.ownerId,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled reward target in status planned. */
export function newScheduledRewardTarget(code: string, title: string): ScheduledRewardTarget {
  return new ScheduledRewardTarget(code, title, 0, 0, "", 0, "", false, "planned");
}
