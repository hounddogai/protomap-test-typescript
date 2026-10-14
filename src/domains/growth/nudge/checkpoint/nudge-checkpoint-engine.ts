import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeCheckpoint } from "./nudge-checkpoint.js";

/** One step of the nudge checkpoint calculation. */
export interface NudgeCheckpointFactor {
  describe(): string;
  adjust(item: NudgeCheckpoint, value: number): number;
}

export class TieredNudgeCheckpointAdjuster implements NudgeCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CountryNudgeCheckpointAdjuster implements NudgeCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: NudgeCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentNudgeCheckpointAdjuster implements NudgeCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NudgeCheckpointRevisionOffsetAdjuster implements NudgeCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: NudgeCheckpoint, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedNudgeCheckpointAdjuster implements NudgeCheckpointFactor {
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

  adjust(item: NudgeCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the nudge checkpoint steps in order and keeps a trace of each. */
export class NudgeCheckpointEngine {
  steps: NudgeCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: NudgeCheckpoint): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: NudgeCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultNudgeCheckpointEngine(flagsValue: flags.Registry): NudgeCheckpointEngine {
  return new NudgeCheckpointEngine(
    [
      new TieredNudgeCheckpointAdjuster([512, 1189], [1.11, 1.16]),
      new CountryNudgeCheckpointAdjuster(
        new Map<string, number>([["south", 0.75], ["north", 0.8], ["west", 0.76]]),
      ),
      new PercentNudgeCheckpointAdjuster(-11.8),
      new NudgeCheckpointRevisionOffsetAdjuster(1.55),
      new FlaggedNudgeCheckpointAdjuster(flagsValue, "nudge-checkpoint-manual", 9.4),
    ],
    [],
    3.3,
    51347.2,
  );
}
