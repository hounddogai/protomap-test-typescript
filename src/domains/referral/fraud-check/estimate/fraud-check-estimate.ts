/**
 * The fraud check estimate records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check estimate is in its life cycle. */
export type FraudCheckEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One fraud check estimate, with what the planners need to act on it. */
export class FraudCheckEstimate {
  code: string;
  name: string;
  timezone: string;
  limit: number;
  campaignRef: string;
  archived: boolean;
  phone: string;
  country: string;
  startsAt: number;
  status: FraudCheckEstimateStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    limit: number,
    campaignRef: string,
    archived: boolean,
    phone: string,
    country: string,
    startsAt: number,
    status: FraudCheckEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.limit = limit;
    this.campaignRef = campaignRef;
    this.archived = archived;
    this.phone = phone;
    this.country = country;
    this.startsAt = startsAt;
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

  canMoveTo(next: FraudCheckEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fraud check estimate"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.startsAt + this.limit) * 100) / 100;
  }

  copy(): FraudCheckEstimate {
    return new FraudCheckEstimate(
      this.code,
      this.name,
      this.timezone,
      this.limit,
      this.campaignRef,
      this.archived,
      this.phone,
      this.country,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fraud check estimate in status planned. */
export function newFraudCheckEstimate(code: string, name: string): FraudCheckEstimate {
  return new FraudCheckEstimate(code, name, "", 0, "", false, "", "", 0, "planned");
}
