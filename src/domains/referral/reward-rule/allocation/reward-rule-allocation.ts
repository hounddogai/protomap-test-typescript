/**
 * The reward rule allocation records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule allocation is in its life cycle. */
export type RewardRuleAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reward rule allocation as the reward rule team keeps it. */
export class RewardRuleAllocation {
  code: string;
  label: string;
  cohort: string;
  campaignRef: string;
  active: boolean;
  country: string;
  utmSource: string;
  conversionRate: number;
  quantity: number;
  timezone: string;
  channel: string;
  status: RewardRuleAllocationStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    campaignRef: string,
    active: boolean,
    country: string,
    utmSource: string,
    conversionRate: number,
    quantity: number,
    timezone: string,
    channel: string,
    status: RewardRuleAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.campaignRef = campaignRef;
    this.active = active;
    this.country = country;
    this.utmSource = utmSource;
    this.conversionRate = conversionRate;
    this.quantity = quantity;
    this.timezone = timezone;
    this.channel = channel;
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

  canMoveTo(next: RewardRuleAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netValue(): number {
    return Math.round((this.conversionRate - this.quantity) * 100) / 100;
  }

  copy(): RewardRuleAllocation {
    return new RewardRuleAllocation(
      this.code,
      this.label,
      this.cohort,
      this.campaignRef,
      this.active,
      this.country,
      this.utmSource,
      this.conversionRate,
      this.quantity,
      this.timezone,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reward rule allocation in status new. */
export function newRewardRuleAllocation(code: string, label: string): RewardRuleAllocation {
  return new RewardRuleAllocation(code, label, "", "", false, "", "", 0, 0, "", "", "new");
}
