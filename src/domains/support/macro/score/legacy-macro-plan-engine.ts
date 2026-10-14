import * as numbers from "../../../../kit/numbers.js";
import { LegacyMacroPlan } from "./legacy-macro-plan.js";

/** One step of the legacy macro plan calculation. */
export interface LegacyMacroPlanAdjuster {
  describe(): string;
  adjust(item: LegacyMacroPlan, value: number): number;
}

export class MinimumLegacyMacroPlanAdjuster implements LegacyMacroPlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyMacroPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyMacroPlanAdjuster implements LegacyMacroPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyMacroPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryLegacyMacroPlanAdjuster implements LegacyMacroPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: LegacyMacroPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLegacyMacroPlanAdjuster implements LegacyMacroPlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyMacroPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyMacroPlanAdjuster implements LegacyMacroPlanAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyMacroPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy macro plan steps in order and keeps a trace of each. */
export class LegacyMacroPlanEngine {
  steps: LegacyMacroPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyMacroPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyMacroPlan): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LegacyMacroPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyMacroPlanEngine(): LegacyMacroPlanEngine {
  return new LegacyMacroPlanEngine(
    [
      new MinimumLegacyMacroPlanAdjuster(15.6),
      new RoundingLegacyMacroPlanAdjuster(0.1),
      new CountryLegacyMacroPlanAdjuster(new Map<string, number>([["north", 1.06], ["central", 1.02]])),
      new PercentLegacyMacroPlanAdjuster(24.3),
      new TieredLegacyMacroPlanAdjuster([1957, 2781, 6286, 8734], [1.05, 1.19, 1.16, 0.91]),
    ],
    [],
    2,
    25792.9,
  );
}
