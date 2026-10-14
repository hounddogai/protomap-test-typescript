import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionEstimate } from "./retention-estimate.js";

/** One step of the retention estimate calculation. */
export interface RetentionEstimateModifier {
  describe(): string;
  adjust(item: RetentionEstimate, value: number): number;
}

export class CapRetentionEstimateAdjuster implements RetentionEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRetentionEstimateAdjuster implements RetentionEstimateModifier {
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

  adjust(item: RetentionEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionRetentionEstimateAdjuster implements RetentionEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RetentionEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RetentionEstimateBidOffsetAdjuster implements RetentionEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: RetentionEstimate, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class RoundingRetentionEstimateAdjuster implements RetentionEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RetentionEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the retention estimate steps in order and keeps a trace of each. */
export class RetentionEstimateEngine {
  steps: RetentionEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RetentionEstimate): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RetentionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRetentionEstimateEngine(flagsValue: flags.Registry): RetentionEstimateEngine {
  return new RetentionEstimateEngine(
    [
      new CapRetentionEstimateAdjuster(579),
      new FlaggedRetentionEstimateAdjuster(flagsValue, "retention-estimate-pending", 4.8),
      new RegionRetentionEstimateAdjuster(new Map<string, number>([["retail", 0.72]])),
      new RetentionEstimateBidOffsetAdjuster(1.69),
      new RoundingRetentionEstimateAdjuster(0.25),
    ],
    [],
    0.3,
    21584.2,
  );
}
