/**
 * The fallback invite preference records of referral's invite work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback invite preference is in its life cycle. */
export type FallbackInvitePreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback invite preference. Its code is unique within a tenant. */
export class FallbackInvitePreference {
  code: string;
  title: string;
  capacity: number;
  timezone: string;
  frequencyCap: number;
  cost: number;
  score: number;
  amount: number;
  discount: number;
  approved: boolean;
  segment: string;
  status: FallbackInvitePreferenceStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    timezone: string,
    frequencyCap: number,
    cost: number,
    score: number,
    amount: number,
    discount: number,
    approved: boolean,
    segment: string,
    status: FallbackInvitePreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
    this.score = score;
    this.amount = amount;
    this.discount = discount;
    this.approved = approved;
    this.segment = segment;
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

  canMoveTo(next: FallbackInvitePreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: FallbackInvitePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback invite preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback invite preference"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.discount + this.frequencyCap) * 100) / 100;
  }

  copy(): FallbackInvitePreference {
    return new FallbackInvitePreference(
      this.code,
      this.title,
      this.capacity,
      this.timezone,
      this.frequencyCap,
      this.cost,
      this.score,
      this.amount,
      this.discount,
      this.approved,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback invite preference in status requested. */
export function newFallbackInvitePreference(code: string, title: string): FallbackInvitePreference {
  return new FallbackInvitePreference(code, title, 0, "", 0, 0, 0, 0, 0, false, "", "requested");
}
