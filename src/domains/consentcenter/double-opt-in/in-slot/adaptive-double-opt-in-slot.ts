/**
 * The adaptive double opt in slot records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive double opt in slot is in its life cycle. */
export type AdaptiveDoubleOptInSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive double opt in slot as the double opt in team keeps it. */
export class AdaptiveDoubleOptInSlot {
  code: string;
  label: string;
  externalRef: string;
  currency: string;
  capacity: number;
  frequencyCap: number;
  graceDays: number;
  budget: number;
  expiresAt: number;
  status: AdaptiveDoubleOptInSlotStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    currency: string,
    capacity: number,
    frequencyCap: number,
    graceDays: number,
    budget: number,
    expiresAt: number,
    status: AdaptiveDoubleOptInSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.currency = currency;
    this.capacity = capacity;
    this.frequencyCap = frequencyCap;
    this.graceDays = graceDays;
    this.budget = budget;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: AdaptiveDoubleOptInSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveDoubleOptInSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive double opt in slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedValue(): number {
    return Math.round((this.graceDays - this.capacity) * 100) / 100;
  }

  copy(): AdaptiveDoubleOptInSlot {
    return new AdaptiveDoubleOptInSlot(
      this.code,
      this.label,
      this.externalRef,
      this.currency,
      this.capacity,
      this.frequencyCap,
      this.graceDays,
      this.budget,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive double opt in slot in status draft. */
export function newAdaptiveDoubleOptInSlot(code: string, label: string): AdaptiveDoubleOptInSlot {
  return new AdaptiveDoubleOptInSlot(code, label, "", "", 0, 0, 0, 0, 0, "draft");
}
