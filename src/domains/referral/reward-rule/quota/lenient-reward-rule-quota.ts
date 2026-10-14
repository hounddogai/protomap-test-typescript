/**
 * The lenient reward rule quota records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient reward rule quota is in its life cycle. */
export type LenientRewardRuleQuotaStatus = "created" | "validated" | "published" | "retired";

/** A lenient reward rule quota as the reward rule team keeps it. */
export class LenientRewardRuleQuota {
  code: string;
  title: string;
  minimum: number;
  discount: number;
  campaignRef: string;
  retries: number;
  status: LenientRewardRuleQuotaStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    discount: number,
    campaignRef: string,
    retries: number,
    status: LenientRewardRuleQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.discount = discount;
    this.campaignRef = campaignRef;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientRewardRuleQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientRewardRuleQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward rule quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient reward rule quota"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.minimum - this.discount) * 100) / 100;
  }

  copy(): LenientRewardRuleQuota {
    return new LenientRewardRuleQuota(
      this.code,
      this.title,
      this.minimum,
      this.discount,
      this.campaignRef,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient reward rule quota in status created. */
export function newLenientRewardRuleQuota(code: string, title: string): LenientRewardRuleQuota {
  return new LenientRewardRuleQuota(code, title, 0, 0, "", 0, "created");
}
