/**
 * The batched payout baseline records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched payout baseline is in its life cycle. */
export type BatchedPayoutBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** A batched payout baseline as the payout team keeps it. */
export class BatchedPayoutBaseline {
  code: string;
  label: string;
  channel: string;
  visible: boolean;
  limit: number;
  ratio: number;
  quantity: number;
  checksum: string;
  sendAt: number;
  cohort: string;
  status: BatchedPayoutBaselineStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    visible: boolean,
    limit: number,
    ratio: number,
    quantity: number,
    checksum: string,
    sendAt: number,
    cohort: string,
    status: BatchedPayoutBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.visible = visible;
    this.limit = limit;
    this.ratio = ratio;
    this.quantity = quantity;
    this.checksum = checksum;
    this.sendAt = sendAt;
    this.cohort = cohort;
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

  canMoveTo(next: BatchedPayoutBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
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

  moveTo(next: BatchedPayoutBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched payout baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round((this.quantity + this.ratio) * 100) / 100;
  }

  copy(): BatchedPayoutBaseline {
    return new BatchedPayoutBaseline(
      this.code,
      this.label,
      this.channel,
      this.visible,
      this.limit,
      this.ratio,
      this.quantity,
      this.checksum,
      this.sendAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched payout baseline in status requested. */
export function newBatchedPayoutBaseline(code: string, label: string): BatchedPayoutBaseline {
  return new BatchedPayoutBaseline(code, label, "", false, 0, 0, 0, "", 0, "", "requested");
}
