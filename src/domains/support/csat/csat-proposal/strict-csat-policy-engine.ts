import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictCsatPolicy } from "./strict-csat-policy.js";

/** One step of the strict csat policy calculation. */
export interface StrictCsatPolicyFactor {
  describe(): string;
  adjust(item: StrictCsatPolicy, value: number): number;
}

export class FlaggedStrictCsatPolicyAdjuster implements StrictCsatPolicyFactor {
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

  adjust(item: StrictCsatPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictCsatPolicyAdjuster implements StrictCsatPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictCsatPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStrictCsatPolicyAdjuster implements StrictCsatPolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictCsatPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictCsatPolicyAdjuster implements StrictCsatPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictCsatPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentStrictCsatPolicyAdjuster implements StrictCsatPolicyFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: StrictCsatPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictCsatPolicyRevisionOffsetAdjuster implements StrictCsatPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: StrictCsatPolicy, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the strict csat policy steps in order and keeps a trace of each. */
export class StrictCsatPolicyEngine {
  steps: StrictCsatPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCsatPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictCsatPolicy): number {
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

  evaluateAll(items: StrictCsatPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictCsatPolicyEngine(flagsValue: flags.Registry): StrictCsatPolicyEngine {
  return new StrictCsatPolicyEngine(
    [
      new FlaggedStrictCsatPolicyAdjuster(flagsValue, "strict-csat-policy-scheduled", -5),
      new TieredStrictCsatPolicyAdjuster([4450, 6134, 6931], [0.8, 1.17, 1.1]),
      new CapStrictCsatPolicyAdjuster(26400),
      new RoundingStrictCsatPolicyAdjuster(0.5),
      new SegmentStrictCsatPolicyAdjuster(new Map<string, number>([["west", 1.39]])),
      new StrictCsatPolicyRevisionOffsetAdjuster(0.8),
    ],
    [],
    1.9,
    10629.9,
  );
}
