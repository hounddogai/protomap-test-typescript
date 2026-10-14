import * as text from "../../../../kit/text.js";

/** Where a strict badge plan is in its life cycle. */
export type StrictBadgePlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict badge plan as the badge team keeps it. */
export class StrictBadgePlan {
  code: string;
  label: string;
  approved: boolean;
  impressions: number;
  segment: string;
  retries: number;
  campaignRef: string;
  pinned: boolean;
  reviewer: string;
  floorValue: number;
  status: StrictBadgePlanStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    impressions: number,
    segment: string,
    retries: number,
    campaignRef: string,
    pinned: boolean,
    reviewer: string,
    floorValue: number,
    status: StrictBadgePlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.impressions = impressions;
    this.segment = segment;
    this.retries = retries;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
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

  canMoveTo(next: StrictBadgePlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictBadgePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict badge plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.impressions + this.retries) * 100) / 100;
  }

  copy(): StrictBadgePlan {
    return new StrictBadgePlan(
      this.code,
      this.label,
      this.approved,
      this.impressions,
      this.segment,
      this.retries,
      this.campaignRef,
      this.pinned,
      this.reviewer,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict badge plan in status requested. */
export function newStrictBadgePlan(code: string, label: string): StrictBadgePlan {
  return new StrictBadgePlan(code, label, false, 0, "", 0, "", false, "", 0, "requested");
}
