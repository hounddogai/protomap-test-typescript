/**
 * The strict retention quota records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict retention quota is in its life cycle. */
export type StrictRetentionQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict retention quota as the retention team keeps it. */
export class StrictRetentionQuota {
  code: string;
  title: string;
  bid: number;
  tags: string[];
  graceDays: number;
  attempts: number;
  category: string;
  variant: string;
  unit: string;
  windowDays: number;
  budget: number;
  status: StrictRetentionQuotaStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    tags: string[],
    graceDays: number,
    attempts: number,
    category: string,
    variant: string,
    unit: string,
    windowDays: number,
    budget: number,
    status: StrictRetentionQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.tags = tags;
    this.graceDays = graceDays;
    this.attempts = attempts;
    this.category = category;
    this.variant = variant;
    this.unit = unit;
    this.windowDays = windowDays;
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

  canMoveTo(next: StrictRetentionQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictRetentionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict retention quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.graceDays - this.windowDays) * 100) / 100;
  }

  copy(): StrictRetentionQuota {
    return new StrictRetentionQuota(
      this.code,
      this.title,
      this.bid,
      this.tags,
      this.graceDays,
      this.attempts,
      this.category,
      this.variant,
      this.unit,
      this.windowDays,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict retention quota in status new. */
export function newStrictRetentionQuota(code: string, title: string): StrictRetentionQuota {
  return new StrictRetentionQuota(code, title, 0, [], 0, 0, "", "", "", 0, 0, "new");
}
