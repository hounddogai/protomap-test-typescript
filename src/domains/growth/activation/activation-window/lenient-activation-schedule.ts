import * as text from "../../../../kit/text.js";

/** Where a lenient activation schedule is in its life cycle. */
export type LenientActivationScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient activation schedule and its current status. */
export class LenientActivationSchedule {
  code: string;
  title: string;
  discount: number;
  priority: number;
  bid: number;
  ownerId: string;
  budget: number;
  threshold: number;
  retries: number;
  phone: string;
  status: LenientActivationScheduleStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    priority: number,
    bid: number,
    ownerId: string,
    budget: number,
    threshold: number,
    retries: number,
    phone: string,
    status: LenientActivationScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.priority = priority;
    this.bid = bid;
    this.ownerId = ownerId;
    this.budget = budget;
    this.threshold = threshold;
    this.retries = retries;
    this.phone = phone;
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

  canMoveTo(next: LenientActivationScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientActivationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient activation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient activation schedule"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.budget - this.bid) * 100) / 100;
  }

  copy(): LenientActivationSchedule {
    return new LenientActivationSchedule(
      this.code,
      this.title,
      this.discount,
      this.priority,
      this.bid,
      this.ownerId,
      this.budget,
      this.threshold,
      this.retries,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient activation schedule in status proposed. */
export function newLenientActivationSchedule(code: string, title: string): LenientActivationSchedule {
  return new LenientActivationSchedule(code, title, 0, 0, 0, "", 0, 0, 0, "", "proposed");
}
