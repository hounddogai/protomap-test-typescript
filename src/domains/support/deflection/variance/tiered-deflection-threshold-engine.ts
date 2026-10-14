import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredDeflectionThreshold } from "./tiered-deflection-threshold.js";

/** One step of the tiered deflection threshold calculation. */
export interface TieredDeflectionThresholdStep {
  describe(): string;
  adjust(item: TieredDeflectionThreshold, value: number): number;
}

export class FlaggedTieredDeflectionThresholdAdjuster implements TieredDeflectionThresholdStep {
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

  adjust(item: TieredDeflectionThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleTieredDeflectionThresholdAdjuster implements TieredDeflectionThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TieredDeflectionThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTieredDeflectionThresholdAdjuster implements TieredDeflectionThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredDeflectionThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredDeflectionThresholdAdjuster implements TieredDeflectionThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredDeflectionThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredDeflectionThresholdAdjuster implements TieredDeflectionThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredDeflectionThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTieredDeflectionThresholdAdjuster implements TieredDeflectionThresholdStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredDeflectionThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered deflection threshold steps in order and keeps a trace of each. */
export class TieredDeflectionThresholdEngine {
  steps: TieredDeflectionThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDeflectionThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredDeflectionThreshold): number {
    let current = item.netExposure();
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

  evaluateAll(items: TieredDeflectionThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredDeflectionThresholdEngine(flagsValue: flags.Registry): TieredDeflectionThresholdEngine {
  return new TieredDeflectionThresholdEngine(
    [
      new FlaggedTieredDeflectionThresholdAdjuster(flagsValue, "tiered-deflection-threshold-default", 4.9),
      new LocaleTieredDeflectionThresholdAdjuster(
        new Map<string, number>([["east", 1.17], ["south", 0.83], ["online", 0.89]]),
      ),
      new RoundingTieredDeflectionThresholdAdjuster(0.05),
      new MinimumTieredDeflectionThresholdAdjuster(13.8),
      new TieredTieredDeflectionThresholdAdjuster([4109, 4891], [1.13, 0.81]),
      new CapTieredDeflectionThresholdAdjuster(1728),
    ],
    [],
    1.7,
    86815.4,
  );
}
