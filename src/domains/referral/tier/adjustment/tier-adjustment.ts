/**
 * The tier adjustment records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier adjustment is in its life cycle. */
export type TierAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tier adjustment as the tier team keeps it. */
export class TierAdjustment {
  code: string;
  title: string;
  source: string;
  openRate: number;
  ceiling: number;
  country: string;
  tags: string[];
  updatedAt: number;
  amount: number;
  notes: string;
  budget: number;
  status: TierAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    openRate: number,
    ceiling: number,
    country: string,
    tags: string[],
    updatedAt: number,
    amount: number,
    notes: string,
    budget: number,
    status: TierAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.country = country;
    this.tags = tags;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.notes = notes;
    this.budget = budget;
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

  canMoveTo(next: TierAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TierAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round(this.openRate * this.amount * 100) / 100;
  }

  copy(): TierAdjustment {
    return new TierAdjustment(
      this.code,
      this.title,
      this.source,
      this.openRate,
      this.ceiling,
      this.country,
      this.tags,
      this.updatedAt,
      this.amount,
      this.notes,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tier adjustment in status new. */
export function newTierAdjustment(code: string, title: string): TierAdjustment {
  return new TierAdjustment(code, title, "", 0, 0, "", [], 0, 0, "", 0, "new");
}
