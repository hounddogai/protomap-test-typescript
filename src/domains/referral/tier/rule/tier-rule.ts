/**
 * The tier rule records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier rule is in its life cycle. */
export type TierRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tier rule and its current status. */
export class TierRule {
  code: string;
  label: string;
  updatedAt: number;
  channel: string;
  rate: number;
  active: boolean;
  tags: string[];
  journeyId: string;
  frequencyCap: number;
  status: TierRuleStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    channel: string,
    rate: number,
    active: boolean,
    tags: string[],
    journeyId: string,
    frequencyCap: number,
    status: TierRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.rate = rate;
    this.active = active;
    this.tags = tags;
    this.journeyId = journeyId;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: TierRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TierRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tier rule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.updatedAt + this.rate) * 100) / 100;
  }

  copy(): TierRule {
    return new TierRule(
      this.code,
      this.label,
      this.updatedAt,
      this.channel,
      this.rate,
      this.active,
      this.tags,
      this.journeyId,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tier rule in status proposed. */
export function newTierRule(code: string, label: string): TierRule {
  return new TierRule(code, label, 0, "", 0, false, [], "", 0, "proposed");
}
