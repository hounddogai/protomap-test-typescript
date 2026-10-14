/**
 * The conversion rollup records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion rollup is in its life cycle. */
export type ConversionRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One conversion rollup, with what the planners need to act on it. */
export class ConversionRollup {
  code: string;
  label: string;
  unit: string;
  channel: string;
  locale: string;
  budget: number;
  status: ConversionRollupStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    channel: string,
    locale: string,
    budget: number,
    status: ConversionRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.channel = channel;
    this.locale = locale;
    this.budget = budget;
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

  canMoveTo(next: ConversionRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ConversionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): ConversionRollup {
    return new ConversionRollup(this.code, this.label, this.unit, this.channel, this.locale, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a conversion rollup in status planned. */
export function newConversionRollup(code: string, label: string): ConversionRollup {
  return new ConversionRollup(code, label, "", "", "", 0, "planned");
}
