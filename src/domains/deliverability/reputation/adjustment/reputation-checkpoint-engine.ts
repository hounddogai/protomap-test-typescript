import * as flags from "../../../../kit/flags.js";
import { ReputationCheckpoint } from "./reputation-checkpoint.js";

/** One step of the reputation checkpoint calculation. */
export interface ReputationCheckpointAdjuster {
  describe(): string;
  adjust(item: ReputationCheckpoint, value: number): number;
}

export class PercentReputationCheckpointAdjuster implements ReputationCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapReputationCheckpointAdjuster implements ReputationCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionReputationCheckpointAdjuster implements ReputationCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ReputationCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredReputationCheckpointAdjuster implements ReputationCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedReputationCheckpointAdjuster implements ReputationCheckpointAdjuster {
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

  adjust(item: ReputationCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reputation checkpoint steps in order and keeps a trace of each. */
export class ReputationCheckpointEngine {
  steps: ReputationCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationCheckpoint): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ReputationCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationCheckpointEngine(flagsValue: flags.Registry): ReputationCheckpointEngine {
  return new ReputationCheckpointEngine(
    [
      new PercentReputationCheckpointAdjuster(8.2),
      new CapReputationCheckpointAdjuster(27837),
      new RegionReputationCheckpointAdjuster(new Map<string, number>([["online", 1.39]])),
      new TieredReputationCheckpointAdjuster([734, 1942, 1959, 7980], [0.97, 1.16, 0.92, 1.13]),
      new FlaggedReputationCheckpointAdjuster(flagsValue, "reputation-checkpoint-tiered", 3.8),
    ],
    [],
    0.5,
    91122.7,
  );
}
