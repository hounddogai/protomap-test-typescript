/**
 * The strict bid rule slot records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict bid rule slot is in its life cycle. */
export type StrictBidRuleSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict bid rule slot. Its code is unique within a tenant. */
export class StrictBidRuleSlot {
  code: string;
  title: string;
  sequence: number;
  rate: number;
  ownerId: string;
  attempts: number;
  phone: string;
  clicks: number;
  maximum: number;
  expiresAt: number;
  status: StrictBidRuleSlotStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    rate: number,
    ownerId: string,
    attempts: number,
    phone: string,
    clicks: number,
    maximum: number,
    expiresAt: number,
    status: StrictBidRuleSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.rate = rate;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.phone = phone;
    this.clicks = clicks;
    this.maximum = maximum;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: StrictBidRuleSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
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

  moveTo(next: StrictBidRuleSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict bid rule slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"strict bid rule slot"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.rate * this.expiresAt * 100) / 100;
  }

  copy(): StrictBidRuleSlot {
    return new StrictBidRuleSlot(
      this.code,
      this.title,
      this.sequence,
      this.rate,
      this.ownerId,
      this.attempts,
      this.phone,
      this.clicks,
      this.maximum,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict bid rule slot in status requested. */
export function newStrictBidRuleSlot(code: string, title: string): StrictBidRuleSlot {
  return new StrictBidRuleSlot(code, title, 0, 0, "", 0, "", 0, 0, 0, "requested");
}
