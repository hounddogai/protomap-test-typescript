import * as text from "../../../../kit/text.js";

/** Where a tiered enrollment schedule is in its life cycle. */
export type TieredEnrollmentScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered enrollment schedule. Its code is unique within a tenant. */
export class TieredEnrollmentSchedule {
  code: string;
  title: string;
  ownerId: string;
  updatedAt: number;
  quantity: number;
  approved: boolean;
  retries: number;
  sendAt: number;
  createdAt: number;
  conversionRate: number;
  region: string;
  status: TieredEnrollmentScheduleStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    updatedAt: number,
    quantity: number,
    approved: boolean,
    retries: number,
    sendAt: number,
    createdAt: number,
    conversionRate: number,
    region: string,
    status: TieredEnrollmentScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.updatedAt = updatedAt;
    this.quantity = quantity;
    this.approved = approved;
    this.retries = retries;
    this.sendAt = sendAt;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
    this.region = region;
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

  canMoveTo(next: TieredEnrollmentScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredEnrollmentScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered enrollment schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered enrollment schedule"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.retries + this.sendAt) * 100) / 100;
  }

  copy(): TieredEnrollmentSchedule {
    return new TieredEnrollmentSchedule(
      this.code,
      this.title,
      this.ownerId,
      this.updatedAt,
      this.quantity,
      this.approved,
      this.retries,
      this.sendAt,
      this.createdAt,
      this.conversionRate,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered enrollment schedule in status planned. */
export function newTieredEnrollmentSchedule(code: string, title: string): TieredEnrollmentSchedule {
  return new TieredEnrollmentSchedule(code, title, "", 0, 0, false, 0, 0, 0, 0, "", "planned");
}
