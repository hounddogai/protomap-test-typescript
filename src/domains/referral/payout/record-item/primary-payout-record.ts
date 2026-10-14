/**
 * The primary payout record records of referral's payout work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary payout record is in its life cycle. */
export type PrimaryPayoutRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One primary payout record, with what the planners need to act on it. */
export class PrimaryPayoutRecord {
  code: string;
  name: string;
  timezone: string;
  channel: string;
  archived: boolean;
  budget: number;
  endsAt: number;
  phone: string;
  campaignRef: string;
  status: PrimaryPayoutRecordStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    channel: string,
    archived: boolean,
    budget: number,
    endsAt: number,
    phone: string,
    campaignRef: string,
    status: PrimaryPayoutRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.channel = channel;
    this.archived = archived;
    this.budget = budget;
    this.endsAt = endsAt;
    this.phone = phone;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: PrimaryPayoutRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryPayoutRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary payout record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget - this.endsAt) * 100) / 100;
  }

  copy(): PrimaryPayoutRecord {
    return new PrimaryPayoutRecord(
      this.code,
      this.name,
      this.timezone,
      this.channel,
      this.archived,
      this.budget,
      this.endsAt,
      this.phone,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary payout record in status draft. */
export function newPrimaryPayoutRecord(code: string, name: string): PrimaryPayoutRecord {
  return new PrimaryPayoutRecord(code, name, "", "", false, 0, 0, "", "", "draft");
}
