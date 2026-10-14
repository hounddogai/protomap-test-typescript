/**
 * The weighted double opt in baseline records of consentcenter's double opt in work, and the rules, stores,
 * and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted double opt in baseline is in its life cycle. */
export type WeightedDoubleOptInBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted double opt in baseline, with what the planners need to act on it. */
export class WeightedDoubleOptInBaseline {
  code: string;
  name: string;
  notes: string;
  channel: string;
  cost: number;
  quantity: number;
  conversionRate: number;
  margin: number;
  status: WeightedDoubleOptInBaselineStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    channel: string,
    cost: number,
    quantity: number,
    conversionRate: number,
    margin: number,
    status: WeightedDoubleOptInBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.channel = channel;
    this.cost = cost;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.margin = margin;
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

  canMoveTo(next: WeightedDoubleOptInBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedDoubleOptInBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted double opt in baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round((this.margin + this.conversionRate) * 100) / 100;
  }

  copy(): WeightedDoubleOptInBaseline {
    return new WeightedDoubleOptInBaseline(
      this.code,
      this.name,
      this.notes,
      this.channel,
      this.cost,
      this.quantity,
      this.conversionRate,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted double opt in baseline in status proposed. */
export function newWeightedDoubleOptInBaseline(code: string, name: string): WeightedDoubleOptInBaseline {
  return new WeightedDoubleOptInBaseline(code, name, "", "", 0, 0, 0, 0, "proposed");
}
