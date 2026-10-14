import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitEstimate } from "./wait-estimate.js";

/** One step of the wait estimate calculation. */
export interface WaitEstimateModifier {
  describe(): string;
  adjust(item: WaitEstimate, value: number): number;
}

export class FlaggedWaitEstimateAdjuster implements WaitEstimateModifier {
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

  adjust(item: WaitEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWaitEstimateAdjuster implements WaitEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapWaitEstimateAdjuster implements WaitEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWaitEstimateAdjuster implements WaitEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WaitEstimateImpressionsOffsetAdjuster implements WaitEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: WaitEstimate, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingWaitEstimateAdjuster implements WaitEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the wait estimate steps in order and keeps a trace of each. */
export class WaitEstimateEngine {
  steps: WaitEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WaitEstimate): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: WaitEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWaitEstimateEngine(flagsValue: flags.Registry): WaitEstimateEngine {
  return new WaitEstimateEngine(
    [
      new FlaggedWaitEstimateAdjuster(flagsValue, "wait-estimate-regional", -4.4),
      new MinimumWaitEstimateAdjuster(45.7),
      new CapWaitEstimateAdjuster(48913),
      new TieredWaitEstimateAdjuster([3310, 4404], [0.81, 1.01]),
      new WaitEstimateImpressionsOffsetAdjuster(0.32),
      new RoundingWaitEstimateAdjuster(0.25),
    ],
    [],
    4.6,
    3484.6,
  );
}
