/**
 * The exit rule threshold records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule threshold is in its life cycle. */
export type ExitRuleThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a exit rule threshold and its current status. */
export class ExitRuleThreshold {
  code: string;
  name: string;
  bid: number;
  summary: string;
  maximum: number;
  unit: string;
  budget: number;
  frequencyCap: number;
  floorValue: number;
  status: ExitRuleThresholdStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    summary: string,
    maximum: number,
    unit: string,
    budget: number,
    frequencyCap: number,
    floorValue: number,
    status: ExitRuleThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.summary = summary;
    this.maximum = maximum;
    this.unit = unit;
    this.budget = budget;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
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

  canMoveTo(next: ExitRuleThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ExitRuleThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.maximum - this.budget) * 100) / 100;
  }

  copy(): ExitRuleThreshold {
    return new ExitRuleThreshold(
      this.code,
      this.name,
      this.bid,
      this.summary,
      this.maximum,
      this.unit,
      this.budget,
      this.frequencyCap,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a exit rule threshold in status planned. */
export function newExitRuleThreshold(code: string, name: string): ExitRuleThreshold {
  return new ExitRuleThreshold(code, name, 0, "", 0, "", 0, 0, 0, "planned");
}
