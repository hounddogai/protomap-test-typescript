/**
 * The tiered fraud check policy records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered fraud check policy is in its life cycle. */
export type TieredFraudCheckPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered fraud check policy, with what the planners need to act on it. */
export class TieredFraudCheckPolicy {
  code: string;
  name: string;
  limit: number;
  score: number;
  reviewer: string;
  utmSource: string;
  status: TieredFraudCheckPolicyStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    score: number,
    reviewer: string,
    utmSource: string,
    status: TieredFraudCheckPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.score = score;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
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

  canMoveTo(next: TieredFraudCheckPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: TieredFraudCheckPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered fraud check policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.limit * this.score * 100) / 100;
  }

  copy(): TieredFraudCheckPolicy {
    return new TieredFraudCheckPolicy(
      this.code,
      this.name,
      this.limit,
      this.score,
      this.reviewer,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered fraud check policy in status idle. */
export function newTieredFraudCheckPolicy(code: string, name: string): TieredFraudCheckPolicy {
  return new TieredFraudCheckPolicy(code, name, 0, 0, "", "", "idle");
}
