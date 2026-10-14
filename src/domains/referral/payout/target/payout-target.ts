/**
 * The payout target records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout target is in its life cycle. */
export type PayoutTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a payout target and its current status. */
export class PayoutTarget {
  code: string;
  label: string;
  bid: number;
  sendAt: number;
  region: string;
  priority: number;
  batchSize: number;
  openRate: number;
  status: PayoutTargetStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    sendAt: number,
    region: string,
    priority: number,
    batchSize: number,
    openRate: number,
    status: PayoutTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.sendAt = sendAt;
    this.region = region;
    this.priority = priority;
    this.batchSize = batchSize;
    this.openRate = openRate;
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

  canMoveTo(next: PayoutTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PayoutTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.priority - this.openRate) * 100) / 100;
  }

  copy(): PayoutTarget {
    return new PayoutTarget(
      this.code,
      this.label,
      this.bid,
      this.sendAt,
      this.region,
      this.priority,
      this.batchSize,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a payout target in status draft. */
export function newPayoutTarget(code: string, label: string): PayoutTarget {
  return new PayoutTarget(code, label, 0, 0, "", 0, 0, 0, "draft");
}
