/**
 * The weighted tier record records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted tier record is in its life cycle. */
export type WeightedTierRecordStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a weighted tier record and its current status. */
export class WeightedTierRecord {
  code: string;
  name: string;
  notes: string;
  phone: string;
  ceiling: number;
  category: string;
  durationMinutes: number;
  status: WeightedTierRecordStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    phone: string,
    ceiling: number,
    category: string,
    durationMinutes: number,
    status: WeightedTierRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.phone = phone;
    this.ceiling = ceiling;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedTierRecordStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedTierRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted tier record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedTotal(): number {
    return Math.round((this.durationMinutes - this.ceiling) * 100) / 100;
  }

  copy(): WeightedTierRecord {
    return new WeightedTierRecord(
      this.code,
      this.name,
      this.notes,
      this.phone,
      this.ceiling,
      this.category,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted tier record in status idle. */
export function newWeightedTierRecord(code: string, name: string): WeightedTierRecord {
  return new WeightedTierRecord(code, name, "", "", 0, "", 0, "idle");
}
