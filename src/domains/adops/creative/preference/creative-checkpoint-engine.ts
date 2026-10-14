import * as flags from "../../../../kit/flags.js";
import { CreativeCheckpoint } from "./creative-checkpoint.js";

/** One step of the creative checkpoint calculation. */
export interface CreativeCheckpointFactor {
  describe(): string;
  adjust(item: CreativeCheckpoint, value: number): number;
}

export class MinimumCreativeCheckpointAdjuster implements CreativeCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameCreativeCheckpointAdjuster implements CreativeCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CreativeCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCreativeCheckpointAdjuster implements CreativeCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCreativeCheckpointAdjuster implements CreativeCheckpointFactor {
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

  adjust(item: CreativeCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCreativeCheckpointAdjuster implements CreativeCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the creative checkpoint steps in order and keeps a trace of each. */
export class CreativeCheckpointEngine {
  steps: CreativeCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreativeCheckpoint): number {
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

  evaluateAll(items: CreativeCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreativeCheckpointEngine(flagsValue: flags.Registry): CreativeCheckpointEngine {
  return new CreativeCheckpointEngine(
    [
      new MinimumCreativeCheckpointAdjuster(26.1),
      new NameCreativeCheckpointAdjuster(new Map<string, number>([["retail", 0.8]])),
      new TieredCreativeCheckpointAdjuster([880, 1943, 4116], [0.82, 0.94, 1.01]),
      new FlaggedCreativeCheckpointAdjuster(flagsValue, "creative-checkpoint-capped", -4.1),
      new PercentCreativeCheckpointAdjuster(23),
    ],
    [],
    0.3,
    66916.7,
  );
}
