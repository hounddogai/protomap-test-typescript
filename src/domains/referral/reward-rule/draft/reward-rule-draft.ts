/**
 * The reward rule draft records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule draft is in its life cycle. */
export type RewardRuleDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reward rule draft as the reward rule team keeps it. */
export class RewardRuleDraft {
  code: string;
  name: string;
  revision: number;
  version: number;
  variant: string;
  updatedAt: number;
  startsAt: number;
  approved: boolean;
  externalRef: string;
  status: RewardRuleDraftStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    version: number,
    variant: string,
    updatedAt: number,
    startsAt: number,
    approved: boolean,
    externalRef: string,
    status: RewardRuleDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.version = version;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.startsAt = startsAt;
    this.approved = approved;
    this.externalRef = externalRef;
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

  canMoveTo(next: RewardRuleDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: RewardRuleDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"reward rule draft"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.version * this.revision * 100) / 100;
  }

  copy(): RewardRuleDraft {
    return new RewardRuleDraft(
      this.code,
      this.name,
      this.revision,
      this.version,
      this.variant,
      this.updatedAt,
      this.startsAt,
      this.approved,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward rule draft in status proposed. */
export function newRewardRuleDraft(code: string, name: string): RewardRuleDraft {
  return new RewardRuleDraft(code, name, 0, 0, "", 0, 0, false, "", "proposed");
}
