import * as text from "../../../../kit/text.js";

/** Where a redemption schedule is in its life cycle. */
export type RedemptionScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a redemption schedule and its current status. */
export class RedemptionSchedule {
  code: string;
  name: string;
  contactEmail: string;
  threshold: number;
  category: string;
  archived: boolean;
  createdAt: number;
  currency: string;
  pinned: boolean;
  status: RedemptionScheduleStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    threshold: number,
    category: string,
    archived: boolean,
    createdAt: number,
    currency: string,
    pinned: boolean,
    status: RedemptionScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.category = category;
    this.archived = archived;
    this.createdAt = createdAt;
    this.currency = currency;
    this.pinned = pinned;
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

  canMoveTo(next: RedemptionScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netValue(): number {
    return Math.round((this.threshold - this.createdAt) * 100) / 100;
  }

  copy(): RedemptionSchedule {
    return new RedemptionSchedule(
      this.code,
      this.name,
      this.contactEmail,
      this.threshold,
      this.category,
      this.archived,
      this.createdAt,
      this.currency,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a redemption schedule in status open. */
export function newRedemptionSchedule(code: string, name: string): RedemptionSchedule {
  return new RedemptionSchedule(code, name, "", 0, "", false, 0, "", false, "open");
}
