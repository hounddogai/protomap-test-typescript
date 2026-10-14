/**
 * The pending streak audit records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending streak audit is in its life cycle. */
export type PendingStreakAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending streak audit, with what the planners need to act on it. */
export class PendingStreakAudit {
  code: string;
  title: string;
  phone: string;
  score: number;
  limit: number;
  startsAt: number;
  cost: number;
  journeyId: string;
  checksum: string;
  status: PendingStreakAuditStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    score: number,
    limit: number,
    startsAt: number,
    cost: number,
    journeyId: string,
    checksum: string,
    status: PendingStreakAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.score = score;
    this.limit = limit;
    this.startsAt = startsAt;
    this.cost = cost;
    this.journeyId = journeyId;
    this.checksum = checksum;
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

  canMoveTo(next: PendingStreakAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingStreakAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending streak audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.startsAt + this.cost) * 100) / 100;
  }

  copy(): PendingStreakAudit {
    return new PendingStreakAudit(
      this.code,
      this.title,
      this.phone,
      this.score,
      this.limit,
      this.startsAt,
      this.cost,
      this.journeyId,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending streak audit in status idle. */
export function newPendingStreakAudit(code: string, title: string): PendingStreakAudit {
  return new PendingStreakAudit(code, title, "", 0, 0, 0, 0, "", "", "idle");
}
