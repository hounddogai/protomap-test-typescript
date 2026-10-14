/**
 * The pending bounce record records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending bounce record is in its life cycle. */
export type PendingBounceRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending bounce record. Its code is unique within a tenant. */
export class PendingBounceRecord {
  code: string;
  title: string;
  channel: string;
  floorValue: number;
  expiresAt: number;
  rate: number;
  status: PendingBounceRecordStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    floorValue: number,
    expiresAt: number,
    rate: number,
    status: PendingBounceRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingBounceRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingBounceRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bounce record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round(this.expiresAt * this.floorValue * 100) / 100;
  }

  copy(): PendingBounceRecord {
    return new PendingBounceRecord(
      this.code,
      this.title,
      this.channel,
      this.floorValue,
      this.expiresAt,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending bounce record in status proposed. */
export function newPendingBounceRecord(code: string, title: string): PendingBounceRecord {
  return new PendingBounceRecord(code, title, "", 0, 0, 0, "proposed");
}
