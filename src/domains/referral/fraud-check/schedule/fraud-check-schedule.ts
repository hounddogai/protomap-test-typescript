/**
 * The fraud check schedule records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check schedule is in its life cycle. */
export type FraudCheckScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** A fraud check schedule. Its code is unique within a tenant. */
export class FraudCheckSchedule {
  code: string;
  label: string;
  audienceId: string;
  conversionRate: number;
  budget: number;
  maximum: number;
  priority: number;
  discount: number;
  phone: string;
  createdAt: number;
  status: FraudCheckScheduleStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    conversionRate: number,
    budget: number,
    maximum: number,
    priority: number,
    discount: number,
    phone: string,
    createdAt: number,
    status: FraudCheckScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.conversionRate = conversionRate;
    this.budget = budget;
    this.maximum = maximum;
    this.priority = priority;
    this.discount = discount;
    this.phone = phone;
    this.createdAt = createdAt;
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

  canMoveTo(next: FraudCheckScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"fraud check schedule"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.budget * this.priority * 100) / 100;
  }

  copy(): FraudCheckSchedule {
    return new FraudCheckSchedule(
      this.code,
      this.label,
      this.audienceId,
      this.conversionRate,
      this.budget,
      this.maximum,
      this.priority,
      this.discount,
      this.phone,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check schedule in status requested. */
export function newFraudCheckSchedule(code: string, label: string): FraudCheckSchedule {
  return new FraudCheckSchedule(code, label, "", 0, 0, 0, 0, 0, "", 0, "requested");
}
