/**
 * The reward rule item records of referral's reward rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule item is in its life cycle. */
export type RewardRuleItemStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a reward rule item and its current status. */
export class RewardRuleItem {
  code: string;
  name: string;
  capacity: number;
  archived: boolean;
  journeyId: string;
  pinned: boolean;
  status: RewardRuleItemStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    archived: boolean,
    journeyId: string,
    pinned: boolean,
    status: RewardRuleItemStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.archived = archived;
    this.journeyId = journeyId;
    this.pinned = pinned;
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

  canMoveTo(next: RewardRuleItemStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RewardRuleItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reward rule item"} ${this.code}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): RewardRuleItem {
    return new RewardRuleItem(
      this.code,
      this.name,
      this.capacity,
      this.archived,
      this.journeyId,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward rule item in status draft. */
export function newRewardRuleItem(code: string, name: string): RewardRuleItem {
  return new RewardRuleItem(code, name, 0, false, "", false, "draft");
}
