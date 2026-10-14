import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceBaseline } from "./bounce-baseline.js";

/** One step of the bounce baseline calculation. */
export interface BounceBaselineStep {
  describe(): string;
  adjust(item: BounceBaseline, value: number): number;
}

export class TieredBounceBaselineAdjuster implements BounceBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BounceBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleBounceBaselineAdjuster implements BounceBaselineStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BounceBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBounceBaselineAdjuster implements BounceBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBounceBaselineAdjuster implements BounceBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BounceBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBounceBaselineAdjuster implements BounceBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BounceBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBounceBaselineAdjuster implements BounceBaselineStep {
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

  adjust(item: BounceBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bounce baseline steps in order and keeps a trace of each. */
export class BounceBaselineEngine {
  steps: BounceBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BounceBaseline): number {
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

  evaluateAll(items: BounceBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBounceBaselineEngine(flagsValue: flags.Registry): BounceBaselineEngine {
  return new BounceBaselineEngine(
    [
      new TieredBounceBaselineAdjuster([2005, 5857, 8191, 8710], [1.19, 1.02, 1.17, 0.85]),
      new TitleBounceBaselineAdjuster(new Map<string, number>([["central", 0.9]])),
      new CapBounceBaselineAdjuster(32789),
      new RoundingBounceBaselineAdjuster(0.1),
      new PercentBounceBaselineAdjuster(0.1),
      new FlaggedBounceBaselineAdjuster(flagsValue, "bounce-baseline-regional", 2.5),
    ],
    [],
    4.8,
    78298,
  );
}
