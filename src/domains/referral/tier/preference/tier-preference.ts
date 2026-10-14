/**
 * The tier preference records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier preference is in its life cycle. */
export type TierPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A tier preference as the tier team keeps it. */
export class TierPreference {
  code: string;
  name: string;
  limit: number;
  batchSize: number;
  rate: number;
  capacity: number;
  variant: string;
  weight: number;
  approved: boolean;
  openRate: number;
  notes: string;
  status: TierPreferenceStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    batchSize: number,
    rate: number,
    capacity: number,
    variant: string,
    weight: number,
    approved: boolean,
    openRate: number,
    notes: string,
    status: TierPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.batchSize = batchSize;
    this.rate = rate;
    this.capacity = capacity;
    this.variant = variant;
    this.weight = weight;
    this.approved = approved;
    this.openRate = openRate;
    this.notes = notes;
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

  canMoveTo(next: TierPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tier preference"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.rate - this.batchSize) * 100) / 100;
  }

  copy(): TierPreference {
    return new TierPreference(
      this.code,
      this.name,
      this.limit,
      this.batchSize,
      this.rate,
      this.capacity,
      this.variant,
      this.weight,
      this.approved,
      this.openRate,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tier preference in status requested. */
export function newTierPreference(code: string, name: string): TierPreference {
  return new TierPreference(code, name, 0, 0, 0, 0, "", 0, false, 0, "", "requested");
}
