import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredActivationEstimate } from "./tiered-activation-estimate.js";

/** One step of the tiered activation estimate calculation. */
export interface TieredActivationEstimateModifier {
  describe(): string;
  adjust(item: TieredActivationEstimate, value: number): number;
}

export class TieredActivationEstimateBudgetOffsetAdjuster implements TieredActivationEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: TieredActivationEstimate, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredTieredActivationEstimateAdjuster implements TieredActivationEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredActivationEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredActivationEstimateAdjuster implements TieredActivationEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredActivationEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedTieredActivationEstimateAdjuster implements TieredActivationEstimateModifier {
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

  adjust(item: TieredActivationEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitTieredActivationEstimateAdjuster implements TieredActivationEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: TieredActivationEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered activation estimate steps in order and keeps a trace of each. */
export class TieredActivationEstimateEngine {
  steps: TieredActivationEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredActivationEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredActivationEstimate): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TieredActivationEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredActivationEstimateEngine(flagsValue: flags.Registry): TieredActivationEstimateEngine {
  return new TieredActivationEstimateEngine(
    [
      new TieredActivationEstimateBudgetOffsetAdjuster(0.38),
      new TieredTieredActivationEstimateAdjuster([739, 1171, 5277, 9483], [0.86, 0.95, 1.14, 0.97]),
      new MinimumTieredActivationEstimateAdjuster(33.1),
      new FlaggedTieredActivationEstimateAdjuster(flagsValue, "tiered-activation-estimate-global", 0.1),
      new UnitTieredActivationEstimateAdjuster(
        new Map<string, number>([["south", 0.72], ["central", 0.75], ["retail", 1.01]]),
      ),
    ],
    [],
    0.4,
    85552.5,
  );
}
