/**
 * The pending approval threshold records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending approval threshold is in its life cycle. */
export type PendingApprovalThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a pending approval threshold and its current status. */
export class PendingApprovalThreshold {
  code: string;
  name: string;
  checksum: string;
  conversionRate: number;
  bid: number;
  impressions: number;
  approved: boolean;
  campaignRef: string;
  capacity: number;
  pinned: boolean;
  ownerId: string;
  status: PendingApprovalThresholdStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    conversionRate: number,
    bid: number,
    impressions: number,
    approved: boolean,
    campaignRef: string,
    capacity: number,
    pinned: boolean,
    ownerId: string,
    status: PendingApprovalThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.conversionRate = conversionRate;
    this.bid = bid;
    this.impressions = impressions;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.pinned = pinned;
    this.ownerId = ownerId;
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

  canMoveTo(next: PendingApprovalThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingApprovalThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending approval threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round(this.bid * this.capacity * 100) / 100;
  }

  copy(): PendingApprovalThreshold {
    return new PendingApprovalThreshold(
      this.code,
      this.name,
      this.checksum,
      this.conversionRate,
      this.bid,
      this.impressions,
      this.approved,
      this.campaignRef,
      this.capacity,
      this.pinned,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending approval threshold in status new. */
export function newPendingApprovalThreshold(code: string, name: string): PendingApprovalThreshold {
  return new PendingApprovalThreshold(code, name, "", 0, 0, 0, false, "", 0, false, "", "new");
}
