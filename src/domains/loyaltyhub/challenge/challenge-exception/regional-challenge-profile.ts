import * as text from "../../../../kit/text.js";

/** Where a regional challenge profile is in its life cycle. */
export type RegionalChallengeProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional challenge profile. Its code is unique within a tenant. */
export class RegionalChallengeProfile {
  code: string;
  label: string;
  campaignRef: string;
  windowDays: number;
  budget: number;
  discount: number;
  approved: boolean;
  country: string;
  status: RegionalChallengeProfileStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    windowDays: number,
    budget: number,
    discount: number,
    approved: boolean,
    country: string,
    status: RegionalChallengeProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.windowDays = windowDays;
    this.budget = budget;
    this.discount = discount;
    this.approved = approved;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalChallengeProfileStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalChallengeProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional challenge profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.budget + this.windowDays) * 100) / 100;
  }

  copy(): RegionalChallengeProfile {
    return new RegionalChallengeProfile(
      this.code,
      this.label,
      this.campaignRef,
      this.windowDays,
      this.budget,
      this.discount,
      this.approved,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional challenge profile in status new. */
export function newRegionalChallengeProfile(code: string, label: string): RegionalChallengeProfile {
  return new RegionalChallengeProfile(code, label, "", 0, 0, 0, false, "", "new");
}
