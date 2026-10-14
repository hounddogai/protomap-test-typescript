import * as flags from "../../../../kit/flags.js";
import { LegacyActivationEstimate } from "./legacy-activation-estimate.js";

/** One step of the legacy activation estimate calculation. */
export interface LegacyActivationEstimateFactor {
  describe(): string;
  adjust(item: LegacyActivationEstimate, value: number): number;
}

export class TieredLegacyActivationEstimateAdjuster implements LegacyActivationEstimateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyActivationEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceLegacyActivationEstimateAdjuster implements LegacyActivationEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: LegacyActivationEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLegacyActivationEstimateAdjuster implements LegacyActivationEstimateFactor {
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

  adjust(item: LegacyActivationEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy activation estimate steps in order and keeps a trace of each. */
export class LegacyActivationEstimateEngine {
  steps: LegacyActivationEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyActivationEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyActivationEstimate): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LegacyActivationEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyActivationEstimateEngine(flagsValue: flags.Registry): LegacyActivationEstimateEngine {
  return new LegacyActivationEstimateEngine(
    [
      new TieredLegacyActivationEstimateAdjuster([2576, 2882, 9328], [1.17, 0.82, 1.03]),
      new SourceLegacyActivationEstimateAdjuster(new Map<string, number>([["east", 1.39], ["central", 1.17]])),
      new FlaggedLegacyActivationEstimateAdjuster(flagsValue, "legacy-activation-estimate-fallback", 6.4),
    ],
    [],
    1.7,
    47564.3,
  );
}
