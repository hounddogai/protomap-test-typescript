/**
 * The batched tier record records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched tier record is in its life cycle. */
export type BatchedTierRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One batched tier record, with what the planners need to act on it. */
export class BatchedTierRecord {
  code: string;
  label: string;
  pinned: boolean;
  checksum: string;
  openRate: number;
  impressions: number;
  endsAt: number;
  maximum: number;
  status: BatchedTierRecordStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    checksum: string,
    openRate: number,
    impressions: number,
    endsAt: number,
    maximum: number,
    status: BatchedTierRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.checksum = checksum;
    this.openRate = openRate;
    this.impressions = impressions;
    this.endsAt = endsAt;
    this.maximum = maximum;
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

  canMoveTo(next: BatchedTierRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedTierRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched tier record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.openRate * this.maximum * 100) / 100;
  }

  copy(): BatchedTierRecord {
    return new BatchedTierRecord(
      this.code,
      this.label,
      this.pinned,
      this.checksum,
      this.openRate,
      this.impressions,
      this.endsAt,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched tier record in status draft. */
export function newBatchedTierRecord(code: string, label: string): BatchedTierRecord {
  return new BatchedTierRecord(code, label, false, "", 0, 0, 0, 0, "draft");
}
