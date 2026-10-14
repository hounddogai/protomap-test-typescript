import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredFlightAdjustment } from "./tiered-flight-adjustment.js";

/** One step of the tiered flight adjustment calculation. */
export interface TieredFlightAdjustmentFactor {
  describe(): string;
  adjust(item: TieredFlightAdjustment, value: number): number;
}

export class TitleTieredFlightAdjustmentAdjuster implements TieredFlightAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TieredFlightAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTieredFlightAdjustmentAdjuster implements TieredFlightAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredFlightAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTieredFlightAdjustmentAdjuster implements TieredFlightAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredFlightAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredFlightAdjustmentAdjuster implements TieredFlightAdjustmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredFlightAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTieredFlightAdjustmentAdjuster implements TieredFlightAdjustmentFactor {
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

  adjust(item: TieredFlightAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered flight adjustment steps in order and keeps a trace of each. */
export class TieredFlightAdjustmentEngine {
  steps: TieredFlightAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFlightAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredFlightAdjustment): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: TieredFlightAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredFlightAdjustmentEngine(flagsValue: flags.Registry): TieredFlightAdjustmentEngine {
  return new TieredFlightAdjustmentEngine(
    [
      new TitleTieredFlightAdjustmentAdjuster(
        new Map<string, number>([["east", 0.84], ["west", 0.8], ["north", 0.88]]),
      ),
      new MinimumTieredFlightAdjustmentAdjuster(36.7),
      new CapTieredFlightAdjustmentAdjuster(25661),
      new RoundingTieredFlightAdjustmentAdjuster(0.1),
      new FlaggedTieredFlightAdjustmentAdjuster(flagsValue, "tiered-flight-adjustment-batched", -7.5),
    ],
    [],
    0.8,
    15368.6,
  );
}
