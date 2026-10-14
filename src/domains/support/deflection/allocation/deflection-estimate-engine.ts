import * as flags from "../../../../kit/flags.js";
import { DeflectionEstimate } from "./deflection-estimate.js";

/** One step of the deflection estimate calculation. */
export interface DeflectionEstimateModifier {
  describe(): string;
  adjust(item: DeflectionEstimate, value: number): number;
}

export class LabelDeflectionEstimateAdjuster implements DeflectionEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DeflectionEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDeflectionEstimateAdjuster implements DeflectionEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDeflectionEstimateAdjuster implements DeflectionEstimateModifier {
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

  adjust(item: DeflectionEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DeflectionEstimateRetriesOffsetAdjuster implements DeflectionEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: DeflectionEstimate, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CapDeflectionEstimateAdjuster implements DeflectionEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the deflection estimate steps in order and keeps a trace of each. */
export class DeflectionEstimateEngine {
  steps: DeflectionEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionEstimate): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: DeflectionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionEstimateEngine(flagsValue: flags.Registry): DeflectionEstimateEngine {
  return new DeflectionEstimateEngine(
    [
      new LabelDeflectionEstimateAdjuster(
        new Map<string, number>([["south", 0.83], ["east", 1.33], ["central", 0.87]]),
      ),
      new TieredDeflectionEstimateAdjuster([889, 3023, 3656, 9640], [1.14, 1.07, 0.84, 0.97]),
      new FlaggedDeflectionEstimateAdjuster(flagsValue, "deflection-estimate-capped", 6.4),
      new DeflectionEstimateRetriesOffsetAdjuster(0.28),
      new CapDeflectionEstimateAdjuster(33953),
    ],
    [],
    4.5,
    6696.6,
  );
}
