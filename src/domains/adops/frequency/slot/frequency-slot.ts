/**
 * The frequency slot records of adops's frequency work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a frequency slot is in its life cycle. */
export type FrequencySlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A frequency slot. Its code is unique within a tenant. */
export class FrequencySlot {
  code: string;
  label: string;
  externalRef: string;
  pinned: boolean;
  currency: string;
  discount: number;
  active: boolean;
  impressions: number;
  budget: number;
  limit: number;
  locale: string;
  status: FrequencySlotStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    pinned: boolean,
    currency: string,
    discount: number,
    active: boolean,
    impressions: number,
    budget: number,
    limit: number,
    locale: string,
    status: FrequencySlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.pinned = pinned;
    this.currency = currency;
    this.discount = discount;
    this.active = active;
    this.impressions = impressions;
    this.budget = budget;
    this.limit = limit;
    this.locale = locale;
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

  canMoveTo(next: FrequencySlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
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

  moveTo(next: FrequencySlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.impressions * this.budget * 100) / 100;
  }

  copy(): FrequencySlot {
    return new FrequencySlot(
      this.code,
      this.label,
      this.externalRef,
      this.pinned,
      this.currency,
      this.discount,
      this.active,
      this.impressions,
      this.budget,
      this.limit,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a frequency slot in status open. */
export function newFrequencySlot(code: string, label: string): FrequencySlot {
  return new FrequencySlot(code, label, "", false, "", 0, false, 0, 0, 0, "", "open");
}
