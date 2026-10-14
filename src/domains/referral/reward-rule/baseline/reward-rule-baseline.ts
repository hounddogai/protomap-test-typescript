/**
 * The reward rule baseline records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule baseline is in its life cycle. */
export type RewardRuleBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a reward rule baseline and its current status. */
export class RewardRuleBaseline {
  code: string;
  name: string;
  description: string;
  bid: number;
  attempts: number;
  revision: number;
  endsAt: number;
  currency: string;
  status: RewardRuleBaselineStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    bid: number,
    attempts: number,
    revision: number,
    endsAt: number,
    currency: string,
    status: RewardRuleBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.bid = bid;
    this.attempts = attempts;
    this.revision = revision;
    this.endsAt = endsAt;
    this.currency = currency;
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

  canMoveTo(next: RewardRuleBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"reward rule baseline"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.revision * this.endsAt * 100) / 100;
  }

  copy(): RewardRuleBaseline {
    return new RewardRuleBaseline(
      this.code,
      this.name,
      this.description,
      this.bid,
      this.attempts,
      this.revision,
      this.endsAt,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward rule baseline in status proposed. */
export function newRewardRuleBaseline(code: string, name: string): RewardRuleBaseline {
  return new RewardRuleBaseline(code, name, "", 0, 0, 0, 0, "", "proposed");
}
