import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredSubscriptionScore } from "./tiered-subscription-score.js";

/** One step of the tiered subscription score calculation. */
export interface TieredSubscriptionScoreFactor {
  describe(): string;
  adjust(item: TieredSubscriptionScore, value: number): number;
}

export class FlaggedTieredSubscriptionScoreAdjuster implements TieredSubscriptionScoreFactor {
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

  adjust(item: TieredSubscriptionScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredSubscriptionScoreAdjuster implements TieredSubscriptionScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredSubscriptionScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredSubscriptionScoreAdjuster implements TieredSubscriptionScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredSubscriptionScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTieredSubscriptionScoreAdjuster implements TieredSubscriptionScoreFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredSubscriptionScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSubscriptionScoreRatioOffsetAdjuster implements TieredSubscriptionScoreFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: TieredSubscriptionScore, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the tiered subscription score steps in order and keeps a trace of each. */
export class TieredSubscriptionScoreEngine {
  steps: TieredSubscriptionScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSubscriptionScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredSubscriptionScore): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: TieredSubscriptionScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredSubscriptionScoreEngine(flagsValue: flags.Registry): TieredSubscriptionScoreEngine {
  return new TieredSubscriptionScoreEngine(
    [
      new FlaggedTieredSubscriptionScoreAdjuster(flagsValue, "tiered-subscription-score-legacy", -0.2),
      new RoundingTieredSubscriptionScoreAdjuster(0.25),
      new MinimumTieredSubscriptionScoreAdjuster(27.7),
      new CapTieredSubscriptionScoreAdjuster(41141),
      new TieredSubscriptionScoreRatioOffsetAdjuster(1.72),
    ],
    [],
    2.4,
    44670.3,
  );
}
