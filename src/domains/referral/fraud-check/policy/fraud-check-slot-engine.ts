import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckSlot } from "./fraud-check-slot.js";

/** One step of the fraud check slot calculation. */
export interface FraudCheckSlotModifier {
  describe(): string;
  adjust(item: FraudCheckSlot, value: number): number;
}

export class PercentFraudCheckSlotAdjuster implements FraudCheckSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FraudCheckSlotDurationMinutesOffsetAdjuster implements FraudCheckSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: FraudCheckSlot, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class FlaggedFraudCheckSlotAdjuster implements FraudCheckSlotModifier {
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

  adjust(item: FraudCheckSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFraudCheckSlotAdjuster implements FraudCheckSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFraudCheckSlotAdjuster implements FraudCheckSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFraudCheckSlotAdjuster implements FraudCheckSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fraud check slot steps in order and keeps a trace of each. */
export class FraudCheckSlotEngine {
  steps: FraudCheckSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FraudCheckSlot): number {
    let current = item.effectiveLoad();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: FraudCheckSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFraudCheckSlotEngine(flagsValue: flags.Registry): FraudCheckSlotEngine {
  return new FraudCheckSlotEngine(
    [
      new PercentFraudCheckSlotAdjuster(16.8),
      new FraudCheckSlotDurationMinutesOffsetAdjuster(1.61),
      new FlaggedFraudCheckSlotAdjuster(flagsValue, "fraud-check-slot-rolling", 9),
      new MinimumFraudCheckSlotAdjuster(18.1),
      new CapFraudCheckSlotAdjuster(21407),
      new TieredFraudCheckSlotAdjuster([832, 3507, 7079, 7109], [0.96, 1.08, 0.81, 0.85]),
    ],
    [],
    4.8,
    62698.9,
  );
}
