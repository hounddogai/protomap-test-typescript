import * as numbers from "../../../../kit/numbers.js";
import { LegacyCreativeGroup } from "./legacy-creative-group.js";

/** One step of the legacy creative group calculation. */
export interface LegacyCreativeGroupFactor {
  describe(): string;
  adjust(item: LegacyCreativeGroup, value: number): number;
}

export class LocaleLegacyCreativeGroupAdjuster implements LegacyCreativeGroupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LegacyCreativeGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLegacyCreativeGroupAdjuster implements LegacyCreativeGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyCreativeGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LegacyCreativeGroupCostOffsetAdjuster implements LegacyCreativeGroupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: LegacyCreativeGroup, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class MinimumLegacyCreativeGroupAdjuster implements LegacyCreativeGroupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyCreativeGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLegacyCreativeGroupAdjuster implements LegacyCreativeGroupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyCreativeGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy creative group steps in order and keeps a trace of each. */
export class LegacyCreativeGroupEngine {
  steps: LegacyCreativeGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyCreativeGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyCreativeGroup): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LegacyCreativeGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyCreativeGroupEngine(): LegacyCreativeGroupEngine {
  return new LegacyCreativeGroupEngine(
    [
      new LocaleLegacyCreativeGroupAdjuster(
        new Map<string, number>([["east", 0.99], ["west", 0.99], ["central", 1.13]]),
      ),
      new PercentLegacyCreativeGroupAdjuster(18.3),
      new LegacyCreativeGroupCostOffsetAdjuster(0.11),
      new MinimumLegacyCreativeGroupAdjuster(16.9),
      new CapLegacyCreativeGroupAdjuster(27331),
    ],
    [],
    4.2,
    7831.4,
  );
}
