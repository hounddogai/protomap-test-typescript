import * as text from "../../../../kit/text.js";

/** Where a pending activation schedule is in its life cycle. */
export type PendingActivationScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending activation schedule. Its code is unique within a tenant. */
export class PendingActivationSchedule {
  code: string;
  label: string;
  region: string;
  amount: number;
  sendAt: number;
  timezone: string;
  conversionRate: number;
  ceiling: number;
  status: PendingActivationScheduleStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    amount: number,
    sendAt: number,
    timezone: string,
    conversionRate: number,
    ceiling: number,
    status: PendingActivationScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.amount = amount;
    this.sendAt = sendAt;
    this.timezone = timezone;
    this.conversionRate = conversionRate;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingActivationScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingActivationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending activation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"pending activation schedule"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.ceiling + this.amount) * 100) / 100;
  }

  copy(): PendingActivationSchedule {
    return new PendingActivationSchedule(
      this.code,
      this.label,
      this.region,
      this.amount,
      this.sendAt,
      this.timezone,
      this.conversionRate,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pending activation schedule in status requested. */
export function newPendingActivationSchedule(code: string, label: string): PendingActivationSchedule {
  return new PendingActivationSchedule(code, label, "", 0, 0, "", 0, 0, "requested");
}
