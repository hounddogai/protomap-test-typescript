/**
 * The reward threshold records of loyaltyhub's reward work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward threshold is in its life cycle. */
export type RewardThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reward threshold, with what the planners need to act on it. */
export class RewardThreshold {
  code: string;
  label: string;
  bid: number;
  ownerId: string;
  threshold: number;
  active: boolean;
  createdAt: number;
  graceDays: number;
  reviewer: string;
  status: RewardThresholdStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    ownerId: string,
    threshold: number,
    active: boolean,
    createdAt: number,
    graceDays: number,
    reviewer: string,
    status: RewardThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.active = active;
    this.createdAt = createdAt;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
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

  canMoveTo(next: RewardThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.createdAt + this.bid) * 100) / 100;
  }

  copy(): RewardThreshold {
    return new RewardThreshold(
      this.code,
      this.label,
      this.bid,
      this.ownerId,
      this.threshold,
      this.active,
      this.createdAt,
      this.graceDays,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward threshold in status proposed. */
export function newRewardThreshold(code: string, label: string): RewardThreshold {
  return new RewardThreshold(code, label, 0, "", 0, false, 0, 0, "", "proposed");
}
