import * as numbers from "../../../../kit/numbers.js";
import { StrictCsatQuota } from "./strict-csat-quota.js";

/** One step of the strict csat quota calculation. */
export interface StrictCsatQuotaModifier {
  describe(): string;
  adjust(item: StrictCsatQuota, value: number): number;
}

export class RoundingStrictCsatQuotaAdjuster implements StrictCsatQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictCsatQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStrictCsatQuotaAdjuster implements StrictCsatQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictCsatQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelStrictCsatQuotaAdjuster implements StrictCsatQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictCsatQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictCsatQuotaWeightOffsetAdjuster implements StrictCsatQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: StrictCsatQuota, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class PercentStrictCsatQuotaAdjuster implements StrictCsatQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictCsatQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict csat quota steps in order and keeps a trace of each. */
export class StrictCsatQuotaEngine {
  steps: StrictCsatQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCsatQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictCsatQuota): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: StrictCsatQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictCsatQuotaEngine(): StrictCsatQuotaEngine {
  return new StrictCsatQuotaEngine(
    [
      new RoundingStrictCsatQuotaAdjuster(0.5),
      new CapStrictCsatQuotaAdjuster(14634),
      new ChannelStrictCsatQuotaAdjuster(new Map<string, number>([["west", 1.37]])),
      new StrictCsatQuotaWeightOffsetAdjuster(0.52),
      new PercentStrictCsatQuotaAdjuster(21),
    ],
    [],
    1.2,
    33252.4,
  );
}
