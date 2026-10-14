/**
 * The legacy reward rule cycle records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy reward rule cycle is in its life cycle. */
export type LegacyRewardRuleCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy reward rule cycle as the reward rule team keeps it. */
export class LegacyRewardRuleCycle {
  code: string;
  name: string;
  journeyId: string;
  visible: boolean;
  country: string;
  discount: number;
  pinned: boolean;
  threshold: number;
  notes: string;
  bid: number;
  status: LegacyRewardRuleCycleStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    visible: boolean,
    country: string,
    discount: number,
    pinned: boolean,
    threshold: number,
    notes: string,
    bid: number,
    status: LegacyRewardRuleCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.visible = visible;
    this.country = country;
    this.discount = discount;
    this.pinned = pinned;
    this.threshold = threshold;
    this.notes = notes;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyRewardRuleCycleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyRewardRuleCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reward rule cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.bid + this.threshold) * 100) / 100;
  }

  copy(): LegacyRewardRuleCycle {
    return new LegacyRewardRuleCycle(
      this.code,
      this.name,
      this.journeyId,
      this.visible,
      this.country,
      this.discount,
      this.pinned,
      this.threshold,
      this.notes,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy reward rule cycle in status new. */
export function newLegacyRewardRuleCycle(code: string, name: string): LegacyRewardRuleCycle {
  return new LegacyRewardRuleCycle(code, name, "", false, "", 0, false, 0, "", 0, "new");
}
