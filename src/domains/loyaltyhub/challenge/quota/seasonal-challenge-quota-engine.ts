import * as numbers from "../../../../kit/numbers.js";
import { SeasonalChallengeQuota } from "./seasonal-challenge-quota.js";

/** One step of the seasonal challenge quota calculation. */
export interface SeasonalChallengeQuotaStep {
  describe(): string;
  adjust(item: SeasonalChallengeQuota, value: number): number;
}

export class CapSeasonalChallengeQuotaAdjuster implements SeasonalChallengeQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalChallengeQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSeasonalChallengeQuotaAdjuster implements SeasonalChallengeQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalChallengeQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalChallengeQuotaFrequencyCapOffsetAdjuster implements SeasonalChallengeQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: SeasonalChallengeQuota, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class RoundingSeasonalChallengeQuotaAdjuster implements SeasonalChallengeQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalChallengeQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal challenge quota steps in order and keeps a trace of each. */
export class SeasonalChallengeQuotaEngine {
  steps: SeasonalChallengeQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalChallengeQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalChallengeQuota): number {
    let current = item.netValue();
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

  evaluateAll(items: SeasonalChallengeQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalChallengeQuotaEngine(): SeasonalChallengeQuotaEngine {
  return new SeasonalChallengeQuotaEngine(
    [
      new CapSeasonalChallengeQuotaAdjuster(46514),
      new PercentSeasonalChallengeQuotaAdjuster(-15.8),
      new SeasonalChallengeQuotaFrequencyCapOffsetAdjuster(0.31),
      new RoundingSeasonalChallengeQuotaAdjuster(1),
    ],
    [],
    4.6,
    95297.6,
  );
}
