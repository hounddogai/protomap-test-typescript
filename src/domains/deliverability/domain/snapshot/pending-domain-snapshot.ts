/**
 * The pending domain snapshot records of deliverability's domain work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending domain snapshot is in its life cycle. */
export type PendingDomainSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending domain snapshot as the domain team keeps it. */
export class PendingDomainSnapshot {
  code: string;
  title: string;
  timezone: string;
  discount: number;
  floorValue: number;
  phone: string;
  capacity: number;
  batchSize: number;
  audienceId: string;
  maximum: number;
  status: PendingDomainSnapshotStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    discount: number,
    floorValue: number,
    phone: string,
    capacity: number,
    batchSize: number,
    audienceId: string,
    maximum: number,
    status: PendingDomainSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.discount = discount;
    this.floorValue = floorValue;
    this.phone = phone;
    this.capacity = capacity;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.maximum = maximum;
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

  canMoveTo(next: PendingDomainSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingDomainSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending domain snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending domain snapshot"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.floorValue - this.capacity) * 100) / 100;
  }

  copy(): PendingDomainSnapshot {
    return new PendingDomainSnapshot(
      this.code,
      this.title,
      this.timezone,
      this.discount,
      this.floorValue,
      this.phone,
      this.capacity,
      this.batchSize,
      this.audienceId,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending domain snapshot in status requested. */
export function newPendingDomainSnapshot(code: string, title: string): PendingDomainSnapshot {
  return new PendingDomainSnapshot(code, title, "", 0, 0, "", 0, 0, "", 0, "requested");
}
