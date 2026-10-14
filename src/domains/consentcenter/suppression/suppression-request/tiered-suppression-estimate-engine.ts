import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

/** One step of the tiered suppression estimate calculation. */
export interface TieredSuppressionEstimateFactor {
  describe(): string;
  adjust(item: TieredSuppressionEstimate, value: number): number;
}

export class FlaggedTieredSuppressionEstimateAdjuster implements TieredSuppressionEstimateFactor {
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

  adjust(item: TieredSuppressionEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSuppressionEstimateSendAtOffsetAdjuster implements TieredSuppressionEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: TieredSuppressionEstimate, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingTieredSuppressionEstimateAdjuster implements TieredSuppressionEstimateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredSuppressionEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryTieredSuppressionEstimateAdjuster implements TieredSuppressionEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: TieredSuppressionEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTieredSuppressionEstimateAdjuster implements TieredSuppressionEstimateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredSuppressionEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered suppression estimate steps in order and keeps a trace of each. */
export class TieredSuppressionEstimateEngine {
  steps: TieredSuppressionEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSuppressionEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredSuppressionEstimate): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: TieredSuppressionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredSuppressionEstimateEngine(flagsValue: flags.Registry): TieredSuppressionEstimateEngine {
  return new TieredSuppressionEstimateEngine(
    [
      new FlaggedTieredSuppressionEstimateAdjuster(flagsValue, "tiered-suppression-estimate-batched", 8.5),
      new TieredSuppressionEstimateSendAtOffsetAdjuster(1.87),
      new RoundingTieredSuppressionEstimateAdjuster(0.05),
      new CountryTieredSuppressionEstimateAdjuster(new Map<string, number>([["south", 1.06], ["west", 0.88]])),
      new PercentTieredSuppressionEstimateAdjuster(-24.8),
    ],
    [],
    4.3,
    98630.2,
  );
}
