/**
 * The tiered exit rule entry records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered exit rule entry is in its life cycle. */
export type TieredExitRuleEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered exit rule entry, with what the planners need to act on it. */
export class TieredExitRuleEntry {
  code: string;
  title: string;
  frequencyCap: number;
  limit: number;
  rate: number;
  conversionRate: number;
  cost: number;
  unit: string;
  amount: number;
  status: TieredExitRuleEntryStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    limit: number,
    rate: number,
    conversionRate: number,
    cost: number,
    unit: string,
    amount: number,
    status: TieredExitRuleEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.unit = unit;
    this.amount = amount;
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

  canMoveTo(next: TieredExitRuleEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredExitRuleEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered exit rule entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round(this.frequencyCap * this.rate * 100) / 100;
  }

  copy(): TieredExitRuleEntry {
    return new TieredExitRuleEntry(
      this.code,
      this.title,
      this.frequencyCap,
      this.limit,
      this.rate,
      this.conversionRate,
      this.cost,
      this.unit,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered exit rule entry in status idle. */
export function newTieredExitRuleEntry(code: string, title: string): TieredExitRuleEntry {
  return new TieredExitRuleEntry(code, title, 0, 0, 0, 0, 0, "", 0, "idle");
}
