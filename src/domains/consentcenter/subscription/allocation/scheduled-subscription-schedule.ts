import * as text from "../../../../kit/text.js";

/** Where a scheduled subscription schedule is in its life cycle. */
export type ScheduledSubscriptionScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled subscription schedule. Its code is unique within a tenant. */
export class ScheduledSubscriptionSchedule {
  code: string;
  title: string;
  quantity: number;
  region: string;
  contactEmail: string;
  active: boolean;
  rate: number;
  capacity: number;
  cohort: string;
  clicks: number;
  status: ScheduledSubscriptionScheduleStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    region: string,
    contactEmail: string,
    active: boolean,
    rate: number,
    capacity: number,
    cohort: string,
    clicks: number,
    status: ScheduledSubscriptionScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.region = region;
    this.contactEmail = contactEmail;
    this.active = active;
    this.rate = rate;
    this.capacity = capacity;
    this.cohort = cohort;
    this.clicks = clicks;
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

  canMoveTo(next: ScheduledSubscriptionScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledSubscriptionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled subscription schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled subscription schedule"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.capacity + this.quantity) * 100) / 100;
  }

  copy(): ScheduledSubscriptionSchedule {
    return new ScheduledSubscriptionSchedule(
      this.code,
      this.title,
      this.quantity,
      this.region,
      this.contactEmail,
      this.active,
      this.rate,
      this.capacity,
      this.cohort,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled subscription schedule in status proposed. */
export function newScheduledSubscriptionSchedule(code: string, title: string): ScheduledSubscriptionSchedule {
  return new ScheduledSubscriptionSchedule(code, title, 0, "", "", false, 0, 0, "", 0, "proposed");
}
