/**
 * The tiered warmup cycle records of deliverability's warmup work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered warmup cycle is in its life cycle. */
export type TieredWarmupCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered warmup cycle as the warmup team keeps it. */
export class TieredWarmupCycle {
  code: string;
  label: string;
  currency: string;
  archived: boolean;
  discount: number;
  locale: string;
  approved: boolean;
  score: number;
  budget: number;
  cost: number;
  status: TieredWarmupCycleStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    archived: boolean,
    discount: number,
    locale: string,
    approved: boolean,
    score: number,
    budget: number,
    cost: number,
    status: TieredWarmupCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.archived = archived;
    this.discount = discount;
    this.locale = locale;
    this.approved = approved;
    this.score = score;
    this.budget = budget;
    this.cost = cost;
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

  canMoveTo(next: TieredWarmupCycleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredWarmupCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered warmup cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered warmup cycle"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.discount * this.budget * 100) / 100;
  }

  copy(): TieredWarmupCycle {
    return new TieredWarmupCycle(
      this.code,
      this.label,
      this.currency,
      this.archived,
      this.discount,
      this.locale,
      this.approved,
      this.score,
      this.budget,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered warmup cycle in status new. */
export function newTieredWarmupCycle(code: string, label: string): TieredWarmupCycle {
  return new TieredWarmupCycle(code, label, "", false, 0, "", false, 0, 0, 0, "new");
}
