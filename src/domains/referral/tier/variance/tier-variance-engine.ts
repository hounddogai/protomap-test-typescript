import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierVariance } from "./tier-variance.js";

/** One step of the tier variance calculation. */
export interface TierVarianceStep {
  describe(): string;
  adjust(item: TierVariance, value: number): number;
}

export class TierVarianceRetriesOffsetAdjuster implements TierVarianceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: TierVariance, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class PercentTierVarianceAdjuster implements TierVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTierVarianceAdjuster implements TierVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTierVarianceAdjuster implements TierVarianceStep {
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

  adjust(item: TierVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTierVarianceAdjuster implements TierVarianceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tier variance steps in order and keeps a trace of each. */
export class TierVarianceEngine {
  steps: TierVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TierVariance): number {
    let current = item.netExposure();
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

  evaluateAll(items: TierVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTierVarianceEngine(flagsValue: flags.Registry): TierVarianceEngine {
  return new TierVarianceEngine(
    [
      new TierVarianceRetriesOffsetAdjuster(1.38),
      new PercentTierVarianceAdjuster(23),
      new RoundingTierVarianceAdjuster(1),
      new FlaggedTierVarianceAdjuster(flagsValue, "tier-variance-pending", 5.3),
      new MinimumTierVarianceAdjuster(21.8),
    ],
    [],
    0.1,
    44408.6,
  );
}
