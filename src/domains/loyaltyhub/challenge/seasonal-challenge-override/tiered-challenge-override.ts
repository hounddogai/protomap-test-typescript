/**
 * The tiered challenge override records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered challenge override is in its life cycle. */
export type TieredChallengeOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a tiered challenge override and its current status. */
export class TieredChallengeOverride {
  code: string;
  title: string;
  unit: string;
  capacity: number;
  channel: string;
  ownerId: string;
  campaignRef: string;
  rate: number;
  openRate: number;
  status: TieredChallengeOverrideStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    capacity: number,
    channel: string,
    ownerId: string,
    campaignRef: string,
    rate: number,
    openRate: number,
    status: TieredChallengeOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.capacity = capacity;
    this.channel = channel;
    this.ownerId = ownerId;
    this.campaignRef = campaignRef;
    this.rate = rate;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredChallengeOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredChallengeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered challenge override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.openRate - this.capacity) * 100) / 100;
  }

  copy(): TieredChallengeOverride {
    return new TieredChallengeOverride(
      this.code,
      this.title,
      this.unit,
      this.capacity,
      this.channel,
      this.ownerId,
      this.campaignRef,
      this.rate,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered challenge override in status open. */
export function newTieredChallengeOverride(code: string, title: string): TieredChallengeOverride {
  return new TieredChallengeOverride(code, title, "", 0, "", "", "", 0, 0, "open");
}
