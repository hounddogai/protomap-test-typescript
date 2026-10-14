import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutVariance } from "./opt-out-variance.js";

/** One step of the opt out variance calculation. */
export interface OptOutVarianceStep {
  describe(): string;
  adjust(item: OptOutVariance, value: number): number;
}

export class FlaggedOptOutVarianceAdjuster implements OptOutVarianceStep {
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

  adjust(item: OptOutVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitOptOutVarianceAdjuster implements OptOutVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: OptOutVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapOptOutVarianceAdjuster implements OptOutVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredOptOutVarianceAdjuster implements OptOutVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the opt out variance steps in order and keeps a trace of each. */
export class OptOutVarianceEngine {
  steps: OptOutVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutVariance): number {
    let current = item.measuredValue();
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

  evaluateAll(items: OptOutVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutVarianceEngine(flagsValue: flags.Registry): OptOutVarianceEngine {
  return new OptOutVarianceEngine(
    [
      new FlaggedOptOutVarianceAdjuster(flagsValue, "opt-out-variance-primary", -3.2),
      new UnitOptOutVarianceAdjuster(new Map<string, number>([["central", 0.82], ["west", 1.3]])),
      new CapOptOutVarianceAdjuster(35585),
      new TieredOptOutVarianceAdjuster([5862, 8974], [0.91, 1.09]),
    ],
    [],
    0.7,
    68839.1,
  );
}
