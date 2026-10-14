/**
 * The tiered reward estimate records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered reward estimate is in its life cycle. */
export type TieredRewardEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered reward estimate. Its code is unique within a tenant. */
export class TieredRewardEstimate {
  code: string;
  label: string;
  timezone: string;
  title: string;
  channel: string;
  archived: boolean;
  checksum: string;
  startsAt: number;
  status: TieredRewardEstimateStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    title: string,
    channel: string,
    archived: boolean,
    checksum: string,
    startsAt: number,
    status: TieredRewardEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.title = title;
    this.channel = channel;
    this.archived = archived;
    this.checksum = checksum;
    this.startsAt = startsAt;
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

  canMoveTo(next: TieredRewardEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
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

  moveTo(next: TieredRewardEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered reward estimate"} ${this.code}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): TieredRewardEstimate {
    return new TieredRewardEstimate(
      this.code,
      this.label,
      this.timezone,
      this.title,
      this.channel,
      this.archived,
      this.checksum,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered reward estimate in status proposed. */
export function newTieredRewardEstimate(code: string, label: string): TieredRewardEstimate {
  return new TieredRewardEstimate(code, label, "", "", "", false, "", 0, "proposed");
}
