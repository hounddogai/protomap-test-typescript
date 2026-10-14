/**
 * The manual credit agreement records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual credit agreement is in its life cycle. */
export type ManualCreditAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One manual credit agreement, with what the planners need to act on it. */
export class ManualCreditAgreement {
  code: string;
  title: string;
  campaignRef: string;
  active: boolean;
  conversionRate: number;
  country: string;
  region: string;
  ceiling: number;
  channel: string;
  discount: number;
  status: ManualCreditAgreementStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    active: boolean,
    conversionRate: number,
    country: string,
    region: string,
    ceiling: number,
    channel: string,
    discount: number,
    status: ManualCreditAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.active = active;
    this.conversionRate = conversionRate;
    this.country = country;
    this.region = region;
    this.ceiling = ceiling;
    this.channel = channel;
    this.discount = discount;
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

  canMoveTo(next: ManualCreditAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualCreditAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual credit agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedExposure(): number {
    return Math.round(this.ceiling * this.discount * 100) / 100;
  }

  copy(): ManualCreditAgreement {
    return new ManualCreditAgreement(
      this.code,
      this.title,
      this.campaignRef,
      this.active,
      this.conversionRate,
      this.country,
      this.region,
      this.ceiling,
      this.channel,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual credit agreement in status planned. */
export function newManualCreditAgreement(code: string, title: string): ManualCreditAgreement {
  return new ManualCreditAgreement(code, title, "", false, 0, "", "", 0, "", 0, "planned");
}
