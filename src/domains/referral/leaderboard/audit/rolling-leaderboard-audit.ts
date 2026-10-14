/**
 * The rolling leaderboard audit records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling leaderboard audit is in its life cycle. */
export type RollingLeaderboardAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A rolling leaderboard audit as the leaderboard team keeps it. */
export class RollingLeaderboardAudit {
  code: string;
  label: string;
  score: number;
  contactEmail: string;
  amount: number;
  clicks: number;
  category: string;
  variant: string;
  cost: number;
  discount: number;
  status: RollingLeaderboardAuditStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    contactEmail: string,
    amount: number,
    clicks: number,
    category: string,
    variant: string,
    cost: number,
    discount: number,
    status: RollingLeaderboardAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.clicks = clicks;
    this.category = category;
    this.variant = variant;
    this.cost = cost;
    this.discount = discount;
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

  canMoveTo(next: RollingLeaderboardAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingLeaderboardAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling leaderboard audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.discount - this.amount) * 100) / 100;
  }

  copy(): RollingLeaderboardAudit {
    return new RollingLeaderboardAudit(
      this.code,
      this.label,
      this.score,
      this.contactEmail,
      this.amount,
      this.clicks,
      this.category,
      this.variant,
      this.cost,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling leaderboard audit in status draft. */
export function newRollingLeaderboardAudit(code: string, label: string): RollingLeaderboardAudit {
  return new RollingLeaderboardAudit(code, label, 0, "", 0, 0, "", "", 0, 0, "draft");
}
