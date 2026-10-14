/**
 * The tiered badge adjustment records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered badge adjustment is in its life cycle. */
export type TieredBadgeAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One tiered badge adjustment, with what the planners need to act on it. */
export class TieredBadgeAdjustment {
  code: string;
  name: string;
  batchSize: number;
  contactEmail: string;
  region: string;
  ceiling: number;
  clicks: number;
  retries: number;
  channel: string;
  ownerId: string;
  startsAt: number;
  status: TieredBadgeAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    contactEmail: string,
    region: string,
    ceiling: number,
    clicks: number,
    retries: number,
    channel: string,
    ownerId: string,
    startsAt: number,
    status: TieredBadgeAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.contactEmail = contactEmail;
    this.region = region;
    this.ceiling = ceiling;
    this.clicks = clicks;
    this.retries = retries;
    this.channel = channel;
    this.ownerId = ownerId;
    this.startsAt = startsAt;
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

  canMoveTo(next: TieredBadgeAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
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

  moveTo(next: TieredBadgeAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered badge adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedValue(): number {
    return Math.round(this.retries * this.ceiling * 100) / 100;
  }

  copy(): TieredBadgeAdjustment {
    return new TieredBadgeAdjustment(
      this.code,
      this.name,
      this.batchSize,
      this.contactEmail,
      this.region,
      this.ceiling,
      this.clicks,
      this.retries,
      this.channel,
      this.ownerId,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered badge adjustment in status open. */
export function newTieredBadgeAdjustment(code: string, name: string): TieredBadgeAdjustment {
  return new TieredBadgeAdjustment(code, name, 0, "", "", 0, 0, 0, "", "", 0, "open");
}
