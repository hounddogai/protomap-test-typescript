/**
 * The reward audit records of loyaltyhub's reward work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward audit is in its life cycle. */
export type RewardAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reward audit as the reward team keeps it. */
export class RewardAudit {
  code: string;
  title: string;
  score: number;
  tags: string[];
  timezone: string;
  ownerId: string;
  status: RewardAuditStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    tags: string[],
    timezone: string,
    ownerId: string,
    status: RewardAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.tags = tags;
    this.timezone = timezone;
    this.ownerId = ownerId;
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

  canMoveTo(next: RewardAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reward audit"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): RewardAudit {
    return new RewardAudit(this.code, this.title, this.score, this.tags, this.timezone, this.ownerId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward audit in status proposed. */
export function newRewardAudit(code: string, title: string): RewardAudit {
  return new RewardAudit(code, title, 0, [], "", "", "proposed");
}
