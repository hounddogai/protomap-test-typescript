import * as text from "../../../../kit/text.js";

/** Where a reward profile is in its life cycle. */
export type RewardProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A reward profile. Its code is unique within a tenant. */
export class RewardProfile {
  code: string;
  label: string;
  cohort: string;
  version: number;
  frequencyCap: number;
  openRate: number;
  campaignRef: string;
  batchSize: number;
  category: string;
  externalRef: string;
  bid: number;
  status: RewardProfileStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    version: number,
    frequencyCap: number,
    openRate: number,
    campaignRef: string,
    batchSize: number,
    category: string,
    externalRef: string,
    bid: number,
    status: RewardProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.version = version;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.batchSize = batchSize;
    this.category = category;
    this.externalRef = externalRef;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RewardProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round(this.openRate * this.batchSize * 100) / 100;
  }

  copy(): RewardProfile {
    return new RewardProfile(
      this.code,
      this.label,
      this.cohort,
      this.version,
      this.frequencyCap,
      this.openRate,
      this.campaignRef,
      this.batchSize,
      this.category,
      this.externalRef,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a reward profile in status idle. */
export function newRewardProfile(code: string, label: string): RewardProfile {
  return new RewardProfile(code, label, "", 0, 0, 0, "", 0, "", "", 0, "idle");
}
