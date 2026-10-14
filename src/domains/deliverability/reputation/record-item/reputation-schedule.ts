import * as text from "../../../../kit/text.js";

/** Where a reputation schedule is in its life cycle. */
export type ReputationScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a reputation schedule and its current status. */
export class ReputationSchedule {
  code: string;
  title: string;
  campaignRef: string;
  budget: number;
  floorValue: number;
  ceiling: number;
  phone: string;
  status: ReputationScheduleStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    budget: number,
    floorValue: number,
    ceiling: number,
    phone: string,
    status: ReputationScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.floorValue = floorValue;
    this.ceiling = ceiling;
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

  canMoveTo(next: ReputationScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ReputationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reputation schedule"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.budget - this.floorValue) * 100) / 100;
  }

  copy(): ReputationSchedule {
    return new ReputationSchedule(
      this.code,
      this.title,
      this.campaignRef,
      this.budget,
      this.floorValue,
      this.ceiling,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reputation schedule in status proposed. */
export function newReputationSchedule(code: string, title: string): ReputationSchedule {
  return new ReputationSchedule(code, title, "", 0, 0, 0, "", "proposed");
}
