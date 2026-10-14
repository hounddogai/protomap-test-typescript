/**
 * The regional approval override records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional approval override is in its life cycle. */
export type RegionalApprovalOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a regional approval override and its current status. */
export class RegionalApprovalOverride {
  code: string;
  name: string;
  approved: boolean;
  endsAt: number;
  retries: number;
  variant: string;
  impressions: number;
  status: RegionalApprovalOverrideStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    endsAt: number,
    retries: number,
    variant: string,
    impressions: number,
    status: RegionalApprovalOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.endsAt = endsAt;
    this.retries = retries;
    this.variant = variant;
    this.impressions = impressions;
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

  canMoveTo(next: RegionalApprovalOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
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

  moveTo(next: RegionalApprovalOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional approval override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional approval override"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.impressions + this.endsAt) * 100) / 100;
  }

  copy(): RegionalApprovalOverride {
    return new RegionalApprovalOverride(
      this.code,
      this.name,
      this.approved,
      this.endsAt,
      this.retries,
      this.variant,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional approval override in status planned. */
export function newRegionalApprovalOverride(code: string, name: string): RegionalApprovalOverride {
  return new RegionalApprovalOverride(code, name, false, 0, 0, "", 0, "planned");
}
