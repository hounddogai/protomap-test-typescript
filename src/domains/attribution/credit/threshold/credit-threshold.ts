/**
 * The credit threshold records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit threshold is in its life cycle. */
export type CreditThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A credit threshold as the credit team keeps it. */
export class CreditThreshold {
  code: string;
  label: string;
  clicks: number;
  floorValue: number;
  budget: number;
  region: string;
  channel: string;
  conversionRate: number;
  status: CreditThresholdStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    floorValue: number,
    budget: number,
    region: string,
    channel: string,
    conversionRate: number,
    status: CreditThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.floorValue = floorValue;
    this.budget = budget;
    this.region = region;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.conversionRate * this.clicks * 100) / 100;
  }

  copy(): CreditThreshold {
    return new CreditThreshold(
      this.code,
      this.label,
      this.clicks,
      this.floorValue,
      this.budget,
      this.region,
      this.channel,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a credit threshold in status planned. */
export function newCreditThreshold(code: string, label: string): CreditThreshold {
  return new CreditThreshold(code, label, 0, 0, 0, "", "", 0, "planned");
}
