/**
 * The tier record records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier record is in its life cycle. */
export type TierRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tier record. Its code is unique within a tenant. */
export class TierRecord {
  code: string;
  label: string;
  durationMinutes: number;
  sendAt: number;
  budget: number;
  contactEmail: string;
  region: string;
  updatedAt: number;
  version: number;
  pinned: boolean;
  expiresAt: number;
  status: TierRecordStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    sendAt: number,
    budget: number,
    contactEmail: string,
    region: string,
    updatedAt: number,
    version: number,
    pinned: boolean,
    expiresAt: number,
    status: TierRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.sendAt = sendAt;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.region = region;
    this.updatedAt = updatedAt;
    this.version = version;
    this.pinned = pinned;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: TierRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TierRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"tier record"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.expiresAt * this.durationMinutes * 100) / 100;
  }

  copy(): TierRecord {
    return new TierRecord(
      this.code,
      this.label,
      this.durationMinutes,
      this.sendAt,
      this.budget,
      this.contactEmail,
      this.region,
      this.updatedAt,
      this.version,
      this.pinned,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tier record in status open. */
export function newTierRecord(code: string, label: string): TierRecord {
  return new TierRecord(code, label, 0, 0, 0, "", "", 0, 0, false, 0, "open");
}
