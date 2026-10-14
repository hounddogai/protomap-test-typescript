/**
 * The primary flight override records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary flight override is in its life cycle. */
export type PrimaryFlightOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary flight override as the flight team keeps it. */
export class PrimaryFlightOverride {
  code: string;
  label: string;
  impressions: number;
  conversionRate: number;
  updatedAt: number;
  name: string;
  budget: number;
  variant: string;
  attempts: number;
  status: PrimaryFlightOverrideStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    conversionRate: number,
    updatedAt: number,
    name: string,
    budget: number,
    variant: string,
    attempts: number,
    status: PrimaryFlightOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.conversionRate = conversionRate;
    this.updatedAt = updatedAt;
    this.name = name;
    this.budget = budget;
    this.variant = variant;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryFlightOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryFlightOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary flight override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.impressions - this.conversionRate) * 100) / 100;
  }

  copy(): PrimaryFlightOverride {
    return new PrimaryFlightOverride(
      this.code,
      this.label,
      this.impressions,
      this.conversionRate,
      this.updatedAt,
      this.name,
      this.budget,
      this.variant,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary flight override in status proposed. */
export function newPrimaryFlightOverride(code: string, label: string): PrimaryFlightOverride {
  return new PrimaryFlightOverride(code, label, 0, 0, 0, "", 0, "", 0, "proposed");
}
