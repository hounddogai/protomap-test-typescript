/**
 * The enrollment profile records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment profile is in its life cycle. */
export type EnrollmentProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A enrollment profile. Its code is unique within a tenant. */
export class EnrollmentProfile {
  code: string;
  name: string;
  rate: number;
  updatedAt: number;
  clicks: number;
  country: string;
  visible: boolean;
  floorValue: number;
  summary: string;
  status: EnrollmentProfileStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    updatedAt: number,
    clicks: number,
    country: string,
    visible: boolean,
    floorValue: number,
    summary: string,
    status: EnrollmentProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.country = country;
    this.visible = visible;
    this.floorValue = floorValue;
    this.summary = summary;
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

  canMoveTo(next: EnrollmentProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: EnrollmentProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"enrollment profile"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.rate - this.updatedAt) * 100) / 100;
  }

  copy(): EnrollmentProfile {
    return new EnrollmentProfile(
      this.code,
      this.name,
      this.rate,
      this.updatedAt,
      this.clicks,
      this.country,
      this.visible,
      this.floorValue,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a enrollment profile in status planned. */
export function newEnrollmentProfile(code: string, name: string): EnrollmentProfile {
  return new EnrollmentProfile(code, name, 0, 0, 0, "", false, 0, "", "planned");
}
