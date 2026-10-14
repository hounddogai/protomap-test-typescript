/**
 * The seasonal paywall notice records of growth's paywall work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal paywall notice is in its life cycle. */
export type SeasonalPaywallNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal paywall notice. Its code is unique within a tenant. */
export class SeasonalPaywallNotice {
  code: string;
  label: string;
  minimum: number;
  contactEmail: string;
  region: string;
  reviewer: string;
  floorValue: number;
  ownerId: string;
  batchSize: number;
  graceDays: number;
  status: SeasonalPaywallNoticeStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    contactEmail: string,
    region: string,
    reviewer: string,
    floorValue: number,
    ownerId: string,
    batchSize: number,
    graceDays: number,
    status: SeasonalPaywallNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.region = region;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
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

  canMoveTo(next: SeasonalPaywallNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalPaywallNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal paywall notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal paywall notice"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.graceDays + this.floorValue) * 100) / 100;
  }

  copy(): SeasonalPaywallNotice {
    return new SeasonalPaywallNotice(
      this.code,
      this.label,
      this.minimum,
      this.contactEmail,
      this.region,
      this.reviewer,
      this.floorValue,
      this.ownerId,
      this.batchSize,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal paywall notice in status proposed. */
export function newSeasonalPaywallNotice(code: string, label: string): SeasonalPaywallNotice {
  return new SeasonalPaywallNotice(code, label, 0, "", "", "", 0, "", 0, 0, "proposed");
}
