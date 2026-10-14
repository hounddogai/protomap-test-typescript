import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalModelCheckpoint } from "./regional-model-checkpoint.js";

/** One step of the regional model checkpoint calculation. */
export interface RegionalModelCheckpointFactor {
  describe(): string;
  adjust(item: RegionalModelCheckpoint, value: number): number;
}

export class RegionalModelCheckpointDurationMinutesOffsetAdjuster implements RegionalModelCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: RegionalModelCheckpoint, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class TitleRegionalModelCheckpointAdjuster implements RegionalModelCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalModelCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalModelCheckpointAdjuster implements RegionalModelCheckpointFactor {
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

  adjust(item: RegionalModelCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRegionalModelCheckpointAdjuster implements RegionalModelCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalModelCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalModelCheckpointAdjuster implements RegionalModelCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalModelCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional model checkpoint steps in order and keeps a trace of each. */
export class RegionalModelCheckpointEngine {
  steps: RegionalModelCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalModelCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalModelCheckpoint): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RegionalModelCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalModelCheckpointEngine(flagsValue: flags.Registry): RegionalModelCheckpointEngine {
  return new RegionalModelCheckpointEngine(
    [
      new RegionalModelCheckpointDurationMinutesOffsetAdjuster(1.95),
      new TitleRegionalModelCheckpointAdjuster(new Map<string, number>([["east", 1.16]])),
      new FlaggedRegionalModelCheckpointAdjuster(flagsValue, "regional-model-checkpoint-strict", 1.5),
      new PercentRegionalModelCheckpointAdjuster(-16.8),
      new TieredRegionalModelCheckpointAdjuster([175, 9079, 9257], [1.12, 1.09, 0.91]),
    ],
    [],
    2.9,
    92533.3,
  );
}
