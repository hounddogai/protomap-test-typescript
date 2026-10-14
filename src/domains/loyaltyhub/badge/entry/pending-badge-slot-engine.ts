import * as numbers from "../../../../kit/numbers.js";
import { PendingBadgeSlot } from "./pending-badge-slot.js";

/** One step of the pending badge slot calculation. */
export interface PendingBadgeSlotAdjuster {
  describe(): string;
  adjust(item: PendingBadgeSlot, value: number): number;
}

export class RoundingPendingBadgeSlotAdjuster implements PendingBadgeSlotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBadgeSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPendingBadgeSlotAdjuster implements PendingBadgeSlotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBadgeSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingBadgeSlotAdjuster implements PendingBadgeSlotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBadgeSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingBadgeSlotConversionRateOffsetAdjuster implements PendingBadgeSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: PendingBadgeSlot, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the pending badge slot steps in order and keeps a trace of each. */
export class PendingBadgeSlotEngine {
  steps: PendingBadgeSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBadgeSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingBadgeSlot): number {
    let current = item.projectedVolume();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: PendingBadgeSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingBadgeSlotEngine(): PendingBadgeSlotEngine {
  return new PendingBadgeSlotEngine(
    [
      new RoundingPendingBadgeSlotAdjuster(5),
      new MinimumPendingBadgeSlotAdjuster(5),
      new PercentPendingBadgeSlotAdjuster(6.4),
      new PendingBadgeSlotConversionRateOffsetAdjuster(0.74),
    ],
    [],
    4.4,
    52438,
  );
}
