import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingSubscriptionScore } from "./rolling-subscription-score.js";

/** One step of the rolling subscription score calculation. */
export interface RollingSubscriptionScoreModifier {
  describe(): string;
  adjust(item: RollingSubscriptionScore, value: number): number;
}

export class MinimumRollingSubscriptionScoreAdjuster implements RollingSubscriptionScoreModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingSubscriptionScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRollingSubscriptionScoreAdjuster implements RollingSubscriptionScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingSubscriptionScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRollingSubscriptionScoreAdjuster implements RollingSubscriptionScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingSubscriptionScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRollingSubscriptionScoreAdjuster implements RollingSubscriptionScoreModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingSubscriptionScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingSubscriptionScoreClicksOffsetAdjuster implements RollingSubscriptionScoreModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: RollingSubscriptionScore, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class FlaggedRollingSubscriptionScoreAdjuster implements RollingSubscriptionScoreModifier {
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

  adjust(item: RollingSubscriptionScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling subscription score steps in order and keeps a trace of each. */
export class RollingSubscriptionScoreEngine {
  steps: RollingSubscriptionScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingSubscriptionScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingSubscriptionScore): number {
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

  evaluateAll(items: RollingSubscriptionScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingSubscriptionScoreEngine(flagsValue: flags.Registry): RollingSubscriptionScoreEngine {
  return new RollingSubscriptionScoreEngine(
    [
      new MinimumRollingSubscriptionScoreAdjuster(5.5),
      new TieredRollingSubscriptionScoreAdjuster([1410, 7652, 8153, 8572], [1.06, 0.94, 1.19, 0.94]),
      new RoundingRollingSubscriptionScoreAdjuster(1),
      new CapRollingSubscriptionScoreAdjuster(28627),
      new RollingSubscriptionScoreClicksOffsetAdjuster(0.9),
      new FlaggedRollingSubscriptionScoreAdjuster(flagsValue, "rolling-subscription-score-adaptive", -9.9),
    ],
    [],
    3,
    37665.9,
  );
}
