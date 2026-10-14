/**
 * The adaptive fraud check score records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive fraud check score is in its life cycle. */
export type AdaptiveFraudCheckScoreStatus = "created" | "validated" | "published" | "retired";

/** A adaptive fraud check score. Its code is unique within a tenant. */
export class AdaptiveFraudCheckScore {
  code: string;
  label: string;
  region: string;
  bid: number;
  sendAt: number;
  graceDays: number;
  notes: string;
  campaignRef: string;
  updatedAt: number;
  status: AdaptiveFraudCheckScoreStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    bid: number,
    sendAt: number,
    graceDays: number,
    notes: string,
    campaignRef: string,
    updatedAt: number,
    status: AdaptiveFraudCheckScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.bid = bid;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: AdaptiveFraudCheckScoreStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: AdaptiveFraudCheckScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive fraud check score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.bid - this.graceDays) * 100) / 100;
  }

  copy(): AdaptiveFraudCheckScore {
    return new AdaptiveFraudCheckScore(
      this.code,
      this.label,
      this.region,
      this.bid,
      this.sendAt,
      this.graceDays,
      this.notes,
      this.campaignRef,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive fraud check score in status created. */
export function newAdaptiveFraudCheckScore(code: string, label: string): AdaptiveFraudCheckScore {
  return new AdaptiveFraudCheckScore(code, label, "", 0, 0, 0, "", "", 0, "created");
}
