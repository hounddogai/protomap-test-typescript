/**
 * The primary tier record records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary tier record is in its life cycle. */
export type PrimaryTierRecordStatus = "created" | "validated" | "published" | "retired";

/** A primary tier record. Its code is unique within a tenant. */
export class PrimaryTierRecord {
  code: string;
  title: string;
  checksum: string;
  capacity: number;
  revision: number;
  country: string;
  status: PrimaryTierRecordStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    capacity: number,
    revision: number,
    country: string,
    status: PrimaryTierRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.capacity = capacity;
    this.revision = revision;
    this.country = country;
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

  canMoveTo(next: PrimaryTierRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryTierRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary tier record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.capacity - this.revision) * 100) / 100;
  }

  copy(): PrimaryTierRecord {
    return new PrimaryTierRecord(
      this.code,
      this.title,
      this.checksum,
      this.capacity,
      this.revision,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary tier record in status created. */
export function newPrimaryTierRecord(code: string, title: string): PrimaryTierRecord {
  return new PrimaryTierRecord(code, title, "", 0, 0, "", "created");
}
