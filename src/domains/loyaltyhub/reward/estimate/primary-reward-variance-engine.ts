import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryRewardVariance } from "./primary-reward-variance.js";

/** One step of the primary reward variance calculation. */
export interface PrimaryRewardVarianceModifier {
  describe(): string;
  adjust(item: PrimaryRewardVariance, value: number): number;
}

export class RoundingPrimaryRewardVarianceAdjuster implements PrimaryRewardVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryRewardVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPrimaryRewardVarianceAdjuster implements PrimaryRewardVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryRewardVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryRewardVarianceAdjuster implements PrimaryRewardVarianceModifier {
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

  adjust(item: PrimaryRewardVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryRewardVarianceAdjuster implements PrimaryRewardVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryRewardVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary reward variance steps in order and keeps a trace of each. */
export class PrimaryRewardVarianceEngine {
  steps: PrimaryRewardVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryRewardVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryRewardVariance): number {
    let current = item.netValue();
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

  evaluateAll(items: PrimaryRewardVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryRewardVarianceEngine(flagsValue: flags.Registry): PrimaryRewardVarianceEngine {
  return new PrimaryRewardVarianceEngine(
    [
      new RoundingPrimaryRewardVarianceAdjuster(0.5),
      new PercentPrimaryRewardVarianceAdjuster(9.7),
      new FlaggedPrimaryRewardVarianceAdjuster(flagsValue, "primary-reward-variance-legacy", -2.9),
      new CapPrimaryRewardVarianceAdjuster(509),
    ],
    [],
    0.3,
    60355.7,
  );
}
