/**
 * The batched invite entry records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched invite entry is in its life cycle. */
export type BatchedInviteEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched invite entry, with what the planners need to act on it. */
export class BatchedInviteEntry {
  code: string;
  label: string;
  startsAt: number;
  region: string;
  checksum: string;
  ownerId: string;
  journeyId: string;
  name: string;
  batchSize: number;
  ceiling: number;
  status: BatchedInviteEntryStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    region: string,
    checksum: string,
    ownerId: string,
    journeyId: string,
    name: string,
    batchSize: number,
    ceiling: number,
    status: BatchedInviteEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.region = region;
    this.checksum = checksum;
    this.ownerId = ownerId;
    this.journeyId = journeyId;
    this.name = name;
    this.batchSize = batchSize;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedInviteEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedInviteEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched invite entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round(this.ceiling * this.startsAt * 100) / 100;
  }

  copy(): BatchedInviteEntry {
    return new BatchedInviteEntry(
      this.code,
      this.label,
      this.startsAt,
      this.region,
      this.checksum,
      this.ownerId,
      this.journeyId,
      this.name,
      this.batchSize,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched invite entry in status planned. */
export function newBatchedInviteEntry(code: string, label: string): BatchedInviteEntry {
  return new BatchedInviteEntry(code, label, 0, "", "", "", "", "", 0, 0, "planned");
}
