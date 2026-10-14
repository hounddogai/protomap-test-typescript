import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingExitRuleReview } from "./rolling-exit-rule-review.js";

/** One step of the rolling exit rule review calculation. */
export interface RollingExitRuleReviewFactor {
  describe(): string;
  adjust(item: RollingExitRuleReview, value: number): number;
}

export class FlaggedRollingExitRuleReviewAdjuster implements RollingExitRuleReviewFactor {
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

  adjust(item: RollingExitRuleReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelRollingExitRuleReviewAdjuster implements RollingExitRuleReviewFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingExitRuleReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRollingExitRuleReviewAdjuster implements RollingExitRuleReviewFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingExitRuleReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingExitRuleReviewAdjuster implements RollingExitRuleReviewFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingExitRuleReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RollingExitRuleReviewSendAtOffsetAdjuster implements RollingExitRuleReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: RollingExitRuleReview, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the rolling exit rule review steps in order and keeps a trace of each. */
export class RollingExitRuleReviewEngine {
  steps: RollingExitRuleReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingExitRuleReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingExitRuleReview): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RollingExitRuleReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingExitRuleReviewEngine(flagsValue: flags.Registry): RollingExitRuleReviewEngine {
  return new RollingExitRuleReviewEngine(
    [
      new FlaggedRollingExitRuleReviewAdjuster(flagsValue, "rolling-exit-rule-review-regional", 2.4),
      new LabelRollingExitRuleReviewAdjuster(
        new Map<string, number>([["south", 1.37], ["east", 0.87], ["retail", 1.11]]),
      ),
      new PercentRollingExitRuleReviewAdjuster(22.1),
      new TieredRollingExitRuleReviewAdjuster([4668, 8009, 8150], [0.91, 1.08, 1.14]),
      new RollingExitRuleReviewSendAtOffsetAdjuster(1.31),
    ],
    [],
    1.6,
    2578.2,
  );
}
