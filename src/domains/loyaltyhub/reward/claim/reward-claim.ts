/**
 * The reward claim records of loyaltyhub's reward work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward claim is in its life cycle. */
export type RewardClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reward claim, with what the planners need to act on it. */
export class RewardClaim {
  code: string;
  label: string;
  attempts: number;
  active: boolean;
  timezone: string;
  summary: string;
  updatedAt: number;
  status: RewardClaimStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    active: boolean,
    timezone: string,
    summary: string,
    updatedAt: number,
    status: RewardClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.active = active;
    this.timezone = timezone;
    this.summary = summary;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: RewardClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RewardClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round(this.attempts * this.updatedAt * 100) / 100;
  }

  copy(): RewardClaim {
    return new RewardClaim(
      this.code,
      this.label,
      this.attempts,
      this.active,
      this.timezone,
      this.summary,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward claim in status proposed. */
export function newRewardClaim(code: string, label: string): RewardClaim {
  return new RewardClaim(code, label, 0, false, "", "", 0, "proposed");
}
