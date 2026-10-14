import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredRetentionScore } from "./tiered-retention-score.js";

/** One step of the tiered retention score calculation. */
export interface TieredRetentionScoreModifier {
  describe(): string;
  adjust(item: TieredRetentionScore, value: number): number;
}

export class TieredTieredRetentionScoreAdjuster implements TieredRetentionScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredRetentionScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedTieredRetentionScoreAdjuster implements TieredRetentionScoreModifier {
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

  adjust(item: TieredRetentionScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredRetentionScoreAdjuster implements TieredRetentionScoreModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredRetentionScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRetentionScoreEndsAtOffsetAdjuster implements TieredRetentionScoreModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: TieredRetentionScore, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class MinimumTieredRetentionScoreAdjuster implements TieredRetentionScoreModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRetentionScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTieredRetentionScoreAdjuster implements TieredRetentionScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredRetentionScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered retention score steps in order and keeps a trace of each. */
export class TieredRetentionScoreEngine {
  steps: TieredRetentionScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRetentionScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredRetentionScore): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: TieredRetentionScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredRetentionScoreEngine(flagsValue: flags.Registry): TieredRetentionScoreEngine {
  return new TieredRetentionScoreEngine(
    [
      new TieredTieredRetentionScoreAdjuster([3140, 4523, 8553], [0.92, 0.94, 0.83]),
      new FlaggedTieredRetentionScoreAdjuster(flagsValue, "tiered-retention-score-seasonal", -8),
      new PercentTieredRetentionScoreAdjuster(15.9),
      new TieredRetentionScoreEndsAtOffsetAdjuster(1.95),
      new MinimumTieredRetentionScoreAdjuster(36.3),
      new RoundingTieredRetentionScoreAdjuster(0.1),
    ],
    [],
    2,
    29130.4,
  );
}
