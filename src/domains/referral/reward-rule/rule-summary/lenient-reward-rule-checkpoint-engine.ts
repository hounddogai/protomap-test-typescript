import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientRewardRuleCheckpoint } from "./lenient-reward-rule-checkpoint.js";

/** One step of the lenient reward rule checkpoint calculation. */
export interface LenientRewardRuleCheckpointFactor {
  describe(): string;
  adjust(item: LenientRewardRuleCheckpoint, value: number): number;
}

export class TieredLenientRewardRuleCheckpointAdjuster implements LenientRewardRuleCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientRewardRuleCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLenientRewardRuleCheckpointAdjuster implements LenientRewardRuleCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientRewardRuleCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLenientRewardRuleCheckpointAdjuster implements LenientRewardRuleCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientRewardRuleCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleLenientRewardRuleCheckpointAdjuster implements LenientRewardRuleCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LenientRewardRuleCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LenientRewardRuleCheckpointFrequencyCapOffsetAdjuster implements LenientRewardRuleCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: LenientRewardRuleCheckpoint, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class FlaggedLenientRewardRuleCheckpointAdjuster implements LenientRewardRuleCheckpointFactor {
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

  adjust(item: LenientRewardRuleCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient reward rule checkpoint steps in order and keeps a trace of each. */
export class LenientRewardRuleCheckpointEngine {
  steps: LenientRewardRuleCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientRewardRuleCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientRewardRuleCheckpoint): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LenientRewardRuleCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientRewardRuleCheckpointEngine(flagsValue: flags.Registry): LenientRewardRuleCheckpointEngine {
  return new LenientRewardRuleCheckpointEngine(
    [
      new TieredLenientRewardRuleCheckpointAdjuster([435, 4383], [1.1, 1.02]),
      new MinimumLenientRewardRuleCheckpointAdjuster(13.9),
      new CapLenientRewardRuleCheckpointAdjuster(29917),
      new TitleLenientRewardRuleCheckpointAdjuster(
        new Map<string, number>([["central", 1.21], ["retail", 1.09], ["east", 0.77]]),
      ),
      new LenientRewardRuleCheckpointFrequencyCapOffsetAdjuster(1.08),
      new FlaggedLenientRewardRuleCheckpointAdjuster(flagsValue, "lenient-reward-rule-checkpoint-default", -5.3),
    ],
    [],
    1.6,
    75884,
  );
}
