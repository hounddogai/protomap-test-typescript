/**
 * The pending redemption policy records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending redemption policy is in its life cycle. */
export type PendingRedemptionPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending redemption policy. Its code is unique within a tenant. */
export class PendingRedemptionPolicy {
  code: string;
  title: string;
  revision: number;
  score: number;
  batchSize: number;
  status: PendingRedemptionPolicyStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    score: number,
    batchSize: number,
    status: PendingRedemptionPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.score = score;
    this.batchSize = batchSize;
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

  canMoveTo(next: PendingRedemptionPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingRedemptionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending redemption policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"pending redemption policy"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.revision * this.batchSize * 100) / 100;
  }

  copy(): PendingRedemptionPolicy {
    return new PendingRedemptionPolicy(this.code, this.title, this.revision, this.score, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending redemption policy in status idle. */
export function newPendingRedemptionPolicy(code: string, title: string): PendingRedemptionPolicy {
  return new PendingRedemptionPolicy(code, title, 0, 0, 0, "idle");
}
