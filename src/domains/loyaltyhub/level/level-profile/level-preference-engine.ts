import { LevelPreference } from "./level-preference.js";

/** One step of the level preference calculation. */
export interface LevelPreferenceAdjuster {
  describe(): string;
  adjust(item: LevelPreference, value: number): number;
}

export class PercentLevelPreferenceAdjuster implements LevelPreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLevelPreferenceAdjuster implements LevelPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLevelPreferenceAdjuster implements LevelPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelLevelPreferenceAdjuster implements LevelPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LevelPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the level preference steps in order and keeps a trace of each. */
export class LevelPreferenceEngine {
  steps: LevelPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LevelPreference): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LevelPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLevelPreferenceEngine(): LevelPreferenceEngine {
  return new LevelPreferenceEngine(
    [
      new PercentLevelPreferenceAdjuster(-21.7),
      new TieredLevelPreferenceAdjuster([5541, 6006, 6543], [0.86, 1.16, 1.03]),
      new CapLevelPreferenceAdjuster(11331),
      new ChannelLevelPreferenceAdjuster(
        new Map<string, number>([["online", 1.25], ["west", 1.11], ["central", 0.75]]),
      ),
    ],
    [],
    2.2,
    19125.5,
  );
}
