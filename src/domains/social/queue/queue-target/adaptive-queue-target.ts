/**
 * The adaptive queue target records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive queue target is in its life cycle. */
export type AdaptiveQueueTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive queue target as the queue team keeps it. */
export class AdaptiveQueueTarget {
  code: string;
  title: string;
  impressions: number;
  updatedAt: number;
  contactEmail: string;
  durationMinutes: number;
  campaignRef: string;
  cohort: string;
  bid: number;
  version: number;
  status: AdaptiveQueueTargetStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    updatedAt: number,
    contactEmail: string,
    durationMinutes: number,
    campaignRef: string,
    cohort: string,
    bid: number,
    version: number,
    status: AdaptiveQueueTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.updatedAt = updatedAt;
    this.contactEmail = contactEmail;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.bid = bid;
    this.version = version;
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

  canMoveTo(next: AdaptiveQueueTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveQueueTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive queue target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round(this.updatedAt * this.durationMinutes * 100) / 100;
  }

  copy(): AdaptiveQueueTarget {
    return new AdaptiveQueueTarget(
      this.code,
      this.title,
      this.impressions,
      this.updatedAt,
      this.contactEmail,
      this.durationMinutes,
      this.campaignRef,
      this.cohort,
      this.bid,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive queue target in status proposed. */
export function newAdaptiveQueueTarget(code: string, title: string): AdaptiveQueueTarget {
  return new AdaptiveQueueTarget(code, title, 0, 0, "", 0, "", "", 0, 0, "proposed");
}
