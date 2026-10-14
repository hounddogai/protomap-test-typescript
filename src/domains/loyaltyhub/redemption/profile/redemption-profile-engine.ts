import * as numbers from "../../../../kit/numbers.js";
import { RedemptionProfile } from "./redemption-profile.js";

/** One step of the redemption profile calculation. */
export interface RedemptionProfileFactor {
  describe(): string;
  adjust(item: RedemptionProfile, value: number): number;
}

export class RoundingRedemptionProfileAdjuster implements RedemptionProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRedemptionProfileAdjuster implements RedemptionProfileFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRedemptionProfileAdjuster implements RedemptionProfileFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRedemptionProfileAdjuster implements RedemptionProfileFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelRedemptionProfileAdjuster implements RedemptionProfileFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RedemptionProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the redemption profile steps in order and keeps a trace of each. */
export class RedemptionProfileEngine {
  steps: RedemptionProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RedemptionProfile): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RedemptionProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRedemptionProfileEngine(): RedemptionProfileEngine {
  return new RedemptionProfileEngine(
    [
      new RoundingRedemptionProfileAdjuster(0.25),
      new PercentRedemptionProfileAdjuster(-6.5),
      new MinimumRedemptionProfileAdjuster(33.7),
      new CapRedemptionProfileAdjuster(45347),
      new LabelRedemptionProfileAdjuster(
        new Map<string, number>([["online", 1.31], ["retail", 1.34], ["east", 1.16]]),
      ),
    ],
    [],
    5,
    60918.2,
  );
}
