import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SuppressionVariance } from "./suppression-variance.js";

/** One step of the suppression variance calculation. */
export interface SuppressionVarianceFactor {
  describe(): string;
  adjust(item: SuppressionVariance, value: number): number;
}

export class SourceSuppressionVarianceAdjuster implements SuppressionVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: SuppressionVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSuppressionVarianceAdjuster implements SuppressionVarianceFactor {
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

  adjust(item: SuppressionVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSuppressionVarianceAdjuster implements SuppressionVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SuppressionVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the suppression variance steps in order and keeps a trace of each. */
export class SuppressionVarianceEngine {
  steps: SuppressionVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SuppressionVariance): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SuppressionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSuppressionVarianceEngine(flagsValue: flags.Registry): SuppressionVarianceEngine {
  return new SuppressionVarianceEngine(
    [
      new SourceSuppressionVarianceAdjuster(
        new Map<string, number>([["online", 1.28], ["retail", 1], ["east", 1.28]]),
      ),
      new FlaggedSuppressionVarianceAdjuster(flagsValue, "suppression-variance-legacy", -4.1),
      new TieredSuppressionVarianceAdjuster([391, 3050, 4992, 7808], [1.12, 0.9, 1.06, 0.94]),
    ],
    [],
    3.4,
    27869.7,
  );
}
