/**
 * The pending level policy records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending level policy is in its life cycle. */
export type PendingLevelPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One pending level policy, with what the planners need to act on it. */
export class PendingLevelPolicy {
  code: string;
  name: string;
  bid: number;
  sequence: number;
  source: string;
  expiresAt: number;
  threshold: number;
  graceDays: number;
  ceiling: number;
  status: PendingLevelPolicyStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    sequence: number,
    source: string,
    expiresAt: number,
    threshold: number,
    graceDays: number,
    ceiling: number,
    status: PendingLevelPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.sequence = sequence;
    this.source = source;
    this.expiresAt = expiresAt;
    this.threshold = threshold;
    this.graceDays = graceDays;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingLevelPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PendingLevelPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending level policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending level policy"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.expiresAt - this.threshold) * 100) / 100;
  }

  copy(): PendingLevelPolicy {
    return new PendingLevelPolicy(
      this.code,
      this.name,
      this.bid,
      this.sequence,
      this.source,
      this.expiresAt,
      this.threshold,
      this.graceDays,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pending level policy in status planned. */
export function newPendingLevelPolicy(code: string, name: string): PendingLevelPolicy {
  return new PendingLevelPolicy(code, name, 0, 0, "", 0, 0, 0, 0, "planned");
}
