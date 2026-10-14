/**
 * The payout policy records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout policy is in its life cycle. */
export type PayoutPolicyStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a payout policy and its current status. */
export class PayoutPolicy {
  code: string;
  name: string;
  campaignRef: string;
  ratio: number;
  impressions: number;
  clicks: number;
  status: PayoutPolicyStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    ratio: number,
    impressions: number,
    clicks: number,
    status: PayoutPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.impressions = impressions;
    this.clicks = clicks;
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

  canMoveTo(next: PayoutPolicyStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.impressions + this.clicks) * 100) / 100;
  }

  copy(): PayoutPolicy {
    return new PayoutPolicy(
      this.code,
      this.name,
      this.campaignRef,
      this.ratio,
      this.impressions,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a payout policy in status new. */
export function newPayoutPolicy(code: string, name: string): PayoutPolicy {
  return new PayoutPolicy(code, name, "", 0, 0, 0, "new");
}
