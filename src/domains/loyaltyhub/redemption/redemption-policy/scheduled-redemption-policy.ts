/**
 * The scheduled redemption policy records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled redemption policy is in its life cycle. */
export type ScheduledRedemptionPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a scheduled redemption policy and its current status. */
export class ScheduledRedemptionPolicy {
  code: string;
  title: string;
  openRate: number;
  conversionRate: number;
  phone: string;
  margin: number;
  campaignRef: string;
  discount: number;
  unit: string;
  status: ScheduledRedemptionPolicyStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    conversionRate: number,
    phone: string,
    margin: number,
    campaignRef: string,
    discount: number,
    unit: string,
    status: ScheduledRedemptionPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.conversionRate = conversionRate;
    this.phone = phone;
    this.margin = margin;
    this.campaignRef = campaignRef;
    this.discount = discount;
    this.unit = unit;
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

  canMoveTo(next: ScheduledRedemptionPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledRedemptionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled redemption policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.openRate + this.conversionRate) * 100) / 100;
  }

  copy(): ScheduledRedemptionPolicy {
    return new ScheduledRedemptionPolicy(
      this.code,
      this.title,
      this.openRate,
      this.conversionRate,
      this.phone,
      this.margin,
      this.campaignRef,
      this.discount,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled redemption policy in status requested. */
export function newScheduledRedemptionPolicy(code: string, title: string): ScheduledRedemptionPolicy {
  return new ScheduledRedemptionPolicy(code, title, 0, 0, "", 0, "", 0, "", "requested");
}
