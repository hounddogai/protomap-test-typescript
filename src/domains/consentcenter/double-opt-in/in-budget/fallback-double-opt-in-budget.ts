/**
 * The fallback double opt in budget records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback double opt in budget is in its life cycle. */
export type FallbackDoubleOptInBudgetStatus = "created" | "validated" | "published" | "retired";

/** The record of a fallback double opt in budget and its current status. */
export class FallbackDoubleOptInBudget {
  code: string;
  name: string;
  durationMinutes: number;
  phone: string;
  checksum: string;
  batchSize: number;
  timezone: string;
  label: string;
  endsAt: number;
  status: FallbackDoubleOptInBudgetStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    phone: string,
    checksum: string,
    batchSize: number,
    timezone: string,
    label: string,
    endsAt: number,
    status: FallbackDoubleOptInBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.phone = phone;
    this.checksum = checksum;
    this.batchSize = batchSize;
    this.timezone = timezone;
    this.label = label;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackDoubleOptInBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackDoubleOptInBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback double opt in budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.batchSize - this.durationMinutes) * 100) / 100;
  }

  copy(): FallbackDoubleOptInBudget {
    return new FallbackDoubleOptInBudget(
      this.code,
      this.name,
      this.durationMinutes,
      this.phone,
      this.checksum,
      this.batchSize,
      this.timezone,
      this.label,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback double opt in budget in status created. */
export function newFallbackDoubleOptInBudget(code: string, name: string): FallbackDoubleOptInBudget {
  return new FallbackDoubleOptInBudget(code, name, 0, "", "", 0, "", "", 0, "created");
}
