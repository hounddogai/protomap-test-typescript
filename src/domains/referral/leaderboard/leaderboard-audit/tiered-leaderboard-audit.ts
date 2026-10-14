/**
 * The tiered leaderboard audit records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered leaderboard audit is in its life cycle. */
export type TieredLeaderboardAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered leaderboard audit as the leaderboard team keeps it. */
export class TieredLeaderboardAudit {
  code: string;
  name: string;
  discount: number;
  version: number;
  channel: string;
  description: string;
  variant: string;
  priority: number;
  cohort: string;
  budget: number;
  maximum: number;
  status: TieredLeaderboardAuditStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    version: number,
    channel: string,
    description: string,
    variant: string,
    priority: number,
    cohort: string,
    budget: number,
    maximum: number,
    status: TieredLeaderboardAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.version = version;
    this.channel = channel;
    this.description = description;
    this.variant = variant;
    this.priority = priority;
    this.cohort = cohort;
    this.budget = budget;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredLeaderboardAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredLeaderboardAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered leaderboard audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"tiered leaderboard audit"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.priority * this.version * 100) / 100;
  }

  copy(): TieredLeaderboardAudit {
    return new TieredLeaderboardAudit(
      this.code,
      this.name,
      this.discount,
      this.version,
      this.channel,
      this.description,
      this.variant,
      this.priority,
      this.cohort,
      this.budget,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered leaderboard audit in status draft. */
export function newTieredLeaderboardAudit(code: string, name: string): TieredLeaderboardAudit {
  return new TieredLeaderboardAudit(code, name, 0, 0, "", "", "", 0, "", 0, 0, "draft");
}
