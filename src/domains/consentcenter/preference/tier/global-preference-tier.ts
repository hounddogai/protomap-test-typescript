/**
 * The global preference tier records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global preference tier is in its life cycle. */
export type GlobalPreferenceTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global preference tier as the preference team keeps it. */
export class GlobalPreferenceTier {
  code: string;
  title: string;
  reviewer: string;
  frequencyCap: number;
  expiresAt: number;
  conversionRate: number;
  pinned: boolean;
  budget: number;
  attributes: Map<string, string>;
  status: GlobalPreferenceTierStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    frequencyCap: number,
    expiresAt: number,
    conversionRate: number,
    pinned: boolean,
    budget: number,
    attributes: Map<string, string>,
    status: GlobalPreferenceTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.budget = budget;
    this.attributes = attributes;
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

  canMoveTo(next: GlobalPreferenceTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalPreferenceTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global preference tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global preference tier"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.conversionRate + this.budget) * 100) / 100;
  }

  copy(): GlobalPreferenceTier {
    return new GlobalPreferenceTier(
      this.code,
      this.title,
      this.reviewer,
      this.frequencyCap,
      this.expiresAt,
      this.conversionRate,
      this.pinned,
      this.budget,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global preference tier in status draft. */
export function newGlobalPreferenceTier(code: string, title: string): GlobalPreferenceTier {
  return new GlobalPreferenceTier(code, title, "", 0, 0, 0, false, 0, new Map<string, string>(), "draft");
}
