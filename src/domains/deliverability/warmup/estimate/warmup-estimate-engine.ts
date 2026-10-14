import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupEstimate } from "./warmup-estimate.js";

/** One step of the warmup estimate calculation. */
export interface WarmupEstimateModifier {
  describe(): string;
  adjust(item: WarmupEstimate, value: number): number;
}

export class UtmSourceWarmupEstimateAdjuster implements WarmupEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: WarmupEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWarmupEstimateAdjuster implements WarmupEstimateModifier {
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

  adjust(item: WarmupEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWarmupEstimateAdjuster implements WarmupEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the warmup estimate steps in order and keeps a trace of each. */
export class WarmupEstimateEngine {
  steps: WarmupEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WarmupEstimate): number {
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

  evaluateAll(items: WarmupEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWarmupEstimateEngine(flagsValue: flags.Registry): WarmupEstimateEngine {
  return new WarmupEstimateEngine(
    [
      new UtmSourceWarmupEstimateAdjuster(new Map<string, number>([["west", 0.81]])),
      new FlaggedWarmupEstimateAdjuster(flagsValue, "warmup-estimate-batched", -2.5),
      new TieredWarmupEstimateAdjuster([3504, 4705, 7325, 9333], [0.94, 0.97, 0.83, 1.02]),
    ],
    [],
    2.1,
    99967.7,
  );
}
