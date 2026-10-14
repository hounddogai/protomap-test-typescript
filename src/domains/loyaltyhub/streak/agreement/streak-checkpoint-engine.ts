import * as flags from "../../../../kit/flags.js";
import { StreakCheckpoint } from "./streak-checkpoint.js";

/** One step of the streak checkpoint calculation. */
export interface StreakCheckpointAdjuster {
  describe(): string;
  adjust(item: StreakCheckpoint, value: number): number;
}

export class FlaggedStreakCheckpointAdjuster implements StreakCheckpointAdjuster {
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

  adjust(item: StreakCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleStreakCheckpointAdjuster implements StreakCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: StreakCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StreakCheckpointAttemptsOffsetAdjuster implements StreakCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: StreakCheckpoint, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class TieredStreakCheckpointAdjuster implements StreakCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the streak checkpoint steps in order and keeps a trace of each. */
export class StreakCheckpointEngine {
  steps: StreakCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StreakCheckpoint): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StreakCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStreakCheckpointEngine(flagsValue: flags.Registry): StreakCheckpointEngine {
  return new StreakCheckpointEngine(
    [
      new FlaggedStreakCheckpointAdjuster(flagsValue, "streak-checkpoint-adaptive", 6.6),
      new TitleStreakCheckpointAdjuster(new Map<string, number>([["north", 1.27]])),
      new StreakCheckpointAttemptsOffsetAdjuster(0.77),
      new TieredStreakCheckpointAdjuster([7822, 8585, 9091], [1.06, 1.11, 0.92]),
    ],
    [],
    0.9,
    3266,
  );
}
