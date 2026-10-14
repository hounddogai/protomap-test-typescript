import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierEstimate } from "./tier-estimate.js";

/** One step of the tier estimate calculation. */
export interface TierEstimateStep {
  describe(): string;
  adjust(item: TierEstimate, value: number): number;
}

export class SegmentTierEstimateAdjuster implements TierEstimateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TierEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTierEstimateAdjuster implements TierEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTierEstimateAdjuster implements TierEstimateStep {
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

  adjust(item: TierEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TierEstimateRatioOffsetAdjuster implements TierEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: TierEstimate, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class RoundingTierEstimateAdjuster implements TierEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tier estimate steps in order and keeps a trace of each. */
export class TierEstimateEngine {
  steps: TierEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TierEstimate): number {
    let current = item.projectedValue();
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

  evaluateAll(items: TierEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTierEstimateEngine(flagsValue: flags.Registry): TierEstimateEngine {
  return new TierEstimateEngine(
    [
      new SegmentTierEstimateAdjuster(
        new Map<string, number>([["online", 1.26], ["central", 1], ["retail", 1.05]]),
      ),
      new CapTierEstimateAdjuster(9803),
      new FlaggedTierEstimateAdjuster(flagsValue, "tier-estimate-batched", -1.7),
      new TierEstimateRatioOffsetAdjuster(0.06),
      new RoundingTierEstimateAdjuster(0.25),
    ],
    [],
    1,
    90850,
  );
}
