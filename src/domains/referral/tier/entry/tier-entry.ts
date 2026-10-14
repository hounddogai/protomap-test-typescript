/**
 * The tier entry records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier entry is in its life cycle. */
export type TierEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a tier entry and its current status. */
export class TierEntry {
  code: string;
  name: string;
  cost: number;
  active: boolean;
  title: string;
  minimum: number;
  cohort: string;
  phone: string;
  variant: string;
  attributes: Map<string, string>;
  status: TierEntryStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    active: boolean,
    title: string,
    minimum: number,
    cohort: string,
    phone: string,
    variant: string,
    attributes: Map<string, string>,
    status: TierEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.active = active;
    this.title = title;
    this.minimum = minimum;
    this.cohort = cohort;
    this.phone = phone;
    this.variant = variant;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TierEntryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TierEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round(this.cost * this.minimum * 100) / 100;
  }

  copy(): TierEntry {
    return new TierEntry(
      this.code,
      this.name,
      this.cost,
      this.active,
      this.title,
      this.minimum,
      this.cohort,
      this.phone,
      this.variant,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tier entry in status new. */
export function newTierEntry(code: string, name: string): TierEntry {
  return new TierEntry(code, name, 0, false, "", 0, "", "", "", new Map<string, string>(), "new");
}
