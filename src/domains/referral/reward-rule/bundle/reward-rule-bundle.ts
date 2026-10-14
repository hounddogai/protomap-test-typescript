/**
 * The reward rule bundle records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule bundle is in its life cycle. */
export type RewardRuleBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a reward rule bundle and its current status. */
export class RewardRuleBundle {
  code: string;
  name: string;
  reviewer: string;
  windowDays: number;
  rate: number;
  title: string;
  floorValue: number;
  campaignRef: string;
  impressions: number;
  locale: string;
  phone: string;
  status: RewardRuleBundleStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    windowDays: number,
    rate: number,
    title: string,
    floorValue: number,
    campaignRef: string,
    impressions: number,
    locale: string,
    phone: string,
    status: RewardRuleBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.rate = rate;
    this.title = title;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
    this.locale = locale;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round(this.floorValue * this.rate * 100) / 100;
  }

  copy(): RewardRuleBundle {
    return new RewardRuleBundle(
      this.code,
      this.name,
      this.reviewer,
      this.windowDays,
      this.rate,
      this.title,
      this.floorValue,
      this.campaignRef,
      this.impressions,
      this.locale,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reward rule bundle in status requested. */
export function newRewardRuleBundle(code: string, name: string): RewardRuleBundle {
  return new RewardRuleBundle(code, name, "", 0, 0, "", 0, "", 0, "", "", "requested");
}
