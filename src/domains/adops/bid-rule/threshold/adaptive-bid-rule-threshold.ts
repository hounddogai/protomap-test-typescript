/**
 * The adaptive bid rule threshold records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive bid rule threshold is in its life cycle. */
export type AdaptiveBidRuleThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a adaptive bid rule threshold and its current status. */
export class AdaptiveBidRuleThreshold {
  code: string;
  label: string;
  sequence: number;
  openRate: number;
  amount: number;
  source: string;
  bid: number;
  retries: number;
  reviewer: string;
  clicks: number;
  archived: boolean;
  status: AdaptiveBidRuleThresholdStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    openRate: number,
    amount: number,
    source: string,
    bid: number,
    retries: number,
    reviewer: string,
    clicks: number,
    archived: boolean,
    status: AdaptiveBidRuleThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.openRate = openRate;
    this.amount = amount;
    this.source = source;
    this.bid = bid;
    this.retries = retries;
    this.reviewer = reviewer;
    this.clicks = clicks;
    this.archived = archived;
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

  canMoveTo(next: AdaptiveBidRuleThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveBidRuleThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive bid rule threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.sequence + this.bid) * 100) / 100;
  }

  copy(): AdaptiveBidRuleThreshold {
    return new AdaptiveBidRuleThreshold(
      this.code,
      this.label,
      this.sequence,
      this.openRate,
      this.amount,
      this.source,
      this.bid,
      this.retries,
      this.reviewer,
      this.clicks,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive bid rule threshold in status requested. */
export function newAdaptiveBidRuleThreshold(code: string, label: string): AdaptiveBidRuleThreshold {
  return new AdaptiveBidRuleThreshold(code, label, 0, 0, 0, "", 0, 0, "", 0, false, "requested");
}
