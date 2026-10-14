import * as text from "../../../../kit/text.js";

/** Where a rolling reward request is in its life cycle. */
export type RollingRewardRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling reward request and its current status. */
export class RollingRewardRequest {
  code: string;
  label: string;
  campaignRef: string;
  phone: string;
  reviewer: string;
  attempts: number;
  region: string;
  cohort: string;
  impressions: number;
  pinned: boolean;
  tags: string[];
  status: RollingRewardRequestStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    phone: string,
    reviewer: string,
    attempts: number,
    region: string,
    cohort: string,
    impressions: number,
    pinned: boolean,
    tags: string[],
    status: RollingRewardRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.phone = phone;
    this.reviewer = reviewer;
    this.attempts = attempts;
    this.region = region;
    this.cohort = cohort;
    this.impressions = impressions;
    this.pinned = pinned;
    this.tags = tags;
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

  canMoveTo(next: RollingRewardRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingRewardRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reward request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round(this.attempts * this.impressions * 100) / 100;
  }

  copy(): RollingRewardRequest {
    return new RollingRewardRequest(
      this.code,
      this.label,
      this.campaignRef,
      this.phone,
      this.reviewer,
      this.attempts,
      this.region,
      this.cohort,
      this.impressions,
      this.pinned,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling reward request in status proposed. */
export function newRollingRewardRequest(code: string, label: string): RollingRewardRequest {
  return new RollingRewardRequest(code, label, "", "", "", 0, "", "", 0, false, [], "proposed");
}
