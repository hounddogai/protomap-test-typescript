import * as numbers from "../../../../kit/numbers.js";
import { CappedStreakDigest } from "./capped-streak-digest.js";

/** One step of the capped streak digest calculation. */
export interface CappedStreakDigestModifier {
  describe(): string;
  adjust(item: CappedStreakDigest, value: number): number;
}

export class RoundingCappedStreakDigestAdjuster implements CappedStreakDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedStreakDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCappedStreakDigestAdjuster implements CappedStreakDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedStreakDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleCappedStreakDigestAdjuster implements CappedStreakDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CappedStreakDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCappedStreakDigestAdjuster implements CappedStreakDigestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedStreakDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped streak digest steps in order and keeps a trace of each. */
export class CappedStreakDigestEngine {
  steps: CappedStreakDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedStreakDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedStreakDigest): number {
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

  evaluateAll(items: CappedStreakDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedStreakDigestEngine(): CappedStreakDigestEngine {
  return new CappedStreakDigestEngine(
    [
      new RoundingCappedStreakDigestAdjuster(5),
      new PercentCappedStreakDigestAdjuster(18.9),
      new LocaleCappedStreakDigestAdjuster(new Map<string, number>([["online", 0.85], ["west", 0.87]])),
      new TieredCappedStreakDigestAdjuster([3689, 9124], [1.08, 0.99]),
    ],
    [],
    4.5,
    86965.3,
  );
}
