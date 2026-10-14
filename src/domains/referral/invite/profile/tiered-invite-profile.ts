/**
 * The tiered invite profile records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered invite profile is in its life cycle. */
export type TieredInviteProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a tiered invite profile and its current status. */
export class TieredInviteProfile {
  code: string;
  title: string;
  expiresAt: number;
  conversionRate: number;
  country: string;
  attempts: number;
  capacity: number;
  status: TieredInviteProfileStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    conversionRate: number,
    country: string,
    attempts: number,
    capacity: number,
    status: TieredInviteProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.conversionRate = conversionRate;
    this.country = country;
    this.attempts = attempts;
    this.capacity = capacity;
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

  canMoveTo(next: TieredInviteProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
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

  moveTo(next: TieredInviteProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered invite profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered invite profile"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.attempts * this.capacity * 100) / 100;
  }

  copy(): TieredInviteProfile {
    return new TieredInviteProfile(
      this.code,
      this.title,
      this.expiresAt,
      this.conversionRate,
      this.country,
      this.attempts,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered invite profile in status draft. */
export function newTieredInviteProfile(code: string, title: string): TieredInviteProfile {
  return new TieredInviteProfile(code, title, 0, 0, "", 0, 0, "draft");
}
