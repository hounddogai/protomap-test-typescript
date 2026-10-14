import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictTierSlot } from "./strict-tier-slot.js";

/** One step of the strict tier slot calculation. */
export interface StrictTierSlotFactor {
  describe(): string;
  adjust(item: StrictTierSlot, value: number): number;
}

export class MinimumStrictTierSlotAdjuster implements StrictTierSlotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictTierSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingStrictTierSlotAdjuster implements StrictTierSlotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictTierSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStrictTierSlotAdjuster implements StrictTierSlotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictTierSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStrictTierSlotAdjuster implements StrictTierSlotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictTierSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedStrictTierSlotAdjuster implements StrictTierSlotFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: StrictTierSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelStrictTierSlotAdjuster implements StrictTierSlotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StrictTierSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict tier slot steps in order and keeps a trace of each. */
export class StrictTierSlotEngine {
  steps: StrictTierSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictTierSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictTierSlot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StrictTierSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictTierSlotEngine(flagsValue: flags.Registry): StrictTierSlotEngine {
  return new StrictTierSlotEngine(
    [
      new MinimumStrictTierSlotAdjuster(24.8),
      new RoundingStrictTierSlotAdjuster(1),
      new CapStrictTierSlotAdjuster(30136),
      new TieredStrictTierSlotAdjuster([4166, 7928, 8098], [0.91, 0.86, 1.18]),
      new FlaggedStrictTierSlotAdjuster(flagsValue, "strict-tier-slot-pending", 8.6),
      new LabelStrictTierSlotAdjuster(new Map<string, number>([["retail", 0.81]])),
    ],
    [],
    0.4,
    84116.3,
  );
}
