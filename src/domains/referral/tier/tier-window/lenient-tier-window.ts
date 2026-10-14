/**
 * The lenient tier window records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient tier window is in its life cycle. */
export type LenientTierWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a lenient tier window and its current status. */
export class LenientTierWindow {
  code: string;
  name: string;
  discount: number;
  sequence: number;
  expiresAt: number;
  currency: string;
  cost: number;
  tags: string[];
  category: string;
  batchSize: number;
  windowDays: number;
  status: LenientTierWindowStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    sequence: number,
    expiresAt: number,
    currency: string,
    cost: number,
    tags: string[],
    category: string,
    batchSize: number,
    windowDays: number,
    status: LenientTierWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.sequence = sequence;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.cost = cost;
    this.tags = tags;
    this.category = category;
    this.batchSize = batchSize;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientTierWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientTierWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient tier window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.sequence - this.cost) * 100) / 100;
  }

  copy(): LenientTierWindow {
    return new LenientTierWindow(
      this.code,
      this.name,
      this.discount,
      this.sequence,
      this.expiresAt,
      this.currency,
      this.cost,
      this.tags,
      this.category,
      this.batchSize,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient tier window in status open. */
export function newLenientTierWindow(code: string, name: string): LenientTierWindow {
  return new LenientTierWindow(code, name, 0, 0, 0, "", 0, [], "", 0, 0, "open");
}
