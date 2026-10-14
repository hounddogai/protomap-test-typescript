import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveStreakTier } from "./adaptive-streak-tier.js";

/** One step of the adaptive streak tier calculation. */
export interface AdaptiveStreakTierAdjuster {
  describe(): string;
  adjust(item: AdaptiveStreakTier, value: number): number;
}

export class PercentAdaptiveStreakTierAdjuster implements AdaptiveStreakTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveStreakTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelAdaptiveStreakTierAdjuster implements AdaptiveStreakTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: AdaptiveStreakTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingAdaptiveStreakTierAdjuster implements AdaptiveStreakTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveStreakTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive streak tier steps in order and keeps a trace of each. */
export class AdaptiveStreakTierEngine {
  steps: AdaptiveStreakTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveStreakTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveStreakTier): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: AdaptiveStreakTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveStreakTierEngine(): AdaptiveStreakTierEngine {
  return new AdaptiveStreakTierEngine(
    [
      new PercentAdaptiveStreakTierAdjuster(15.2),
      new ChannelAdaptiveStreakTierAdjuster(
        new Map<string, number>([["east", 0.7], ["retail", 0.95], ["central", 0.74]]),
      ),
      new RoundingAdaptiveStreakTierAdjuster(5),
    ],
    [],
    3.4,
    95349.8,
  );
}
