/**
 * The reply record records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply record is in its life cycle. */
export type ReplyRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reply record as the reply team keeps it. */
export class ReplyRecord {
  code: string;
  name: string;
  country: string;
  impressions: number;
  threshold: number;
  amount: number;
  approved: boolean;
  quantity: number;
  durationMinutes: number;
  status: ReplyRecordStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    impressions: number,
    threshold: number,
    amount: number,
    approved: boolean,
    quantity: number,
    durationMinutes: number,
    status: ReplyRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.impressions = impressions;
    this.threshold = threshold;
    this.amount = amount;
    this.approved = approved;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ReplyRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ReplyRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.quantity + this.durationMinutes) * 100) / 100;
  }

  copy(): ReplyRecord {
    return new ReplyRecord(
      this.code,
      this.name,
      this.country,
      this.impressions,
      this.threshold,
      this.amount,
      this.approved,
      this.quantity,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reply record in status draft. */
export function newReplyRecord(code: string, name: string): ReplyRecord {
  return new ReplyRecord(code, name, "", 0, 0, 0, false, 0, 0, "draft");
}
