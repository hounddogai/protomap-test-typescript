import * as text from "../../../../kit/text.js";

/** Where a invite schedule is in its life cycle. */
export type InviteScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a invite schedule and its current status. */
export class InviteSchedule {
  code: string;
  title: string;
  retries: number;
  discount: number;
  ratio: number;
  journeyId: string;
  capacity: number;
  conversionRate: number;
  status: InviteScheduleStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    discount: number,
    ratio: number,
    journeyId: string,
    capacity: number,
    conversionRate: number,
    status: InviteScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.discount = discount;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: InviteScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
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

  moveTo(next: InviteScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"invite schedule"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.capacity + this.ratio) * 100) / 100;
  }

  copy(): InviteSchedule {
    return new InviteSchedule(
      this.code,
      this.title,
      this.retries,
      this.discount,
      this.ratio,
      this.journeyId,
      this.capacity,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a invite schedule in status open. */
export function newInviteSchedule(code: string, title: string): InviteSchedule {
  return new InviteSchedule(code, title, 0, 0, 0, "", 0, 0, "open");
}
