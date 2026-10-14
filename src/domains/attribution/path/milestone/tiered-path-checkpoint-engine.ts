import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredPathCheckpoint } from "./tiered-path-checkpoint.js";

/** One step of the tiered path checkpoint calculation. */
export interface TieredPathCheckpointStep {
  describe(): string;
  adjust(item: TieredPathCheckpoint, value: number): number;
}

export class RoundingTieredPathCheckpointAdjuster implements TieredPathCheckpointStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredPathCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTieredPathCheckpointAdjuster implements TieredPathCheckpointStep {
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

  adjust(item: TieredPathCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredPathCheckpointAdjuster implements TieredPathCheckpointStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredPathCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentTieredPathCheckpointAdjuster implements TieredPathCheckpointStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TieredPathCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredPathCheckpointAdjuster implements TieredPathCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredPathCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered path checkpoint steps in order and keeps a trace of each. */
export class TieredPathCheckpointEngine {
  steps: TieredPathCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPathCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredPathCheckpoint): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: TieredPathCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredPathCheckpointEngine(flagsValue: flags.Registry): TieredPathCheckpointEngine {
  return new TieredPathCheckpointEngine(
    [
      new RoundingTieredPathCheckpointAdjuster(0.05),
      new FlaggedTieredPathCheckpointAdjuster(flagsValue, "tiered-path-checkpoint-rolling", 7.4),
      new TieredTieredPathCheckpointAdjuster([848, 4415, 5365], [1.05, 0.92, 0.89]),
      new SegmentTieredPathCheckpointAdjuster(
        new Map<string, number>([["north", 1.25], ["west", 0.77], ["online", 0.98]]),
      ),
      new CapTieredPathCheckpointAdjuster(19106),
    ],
    [],
    4.5,
    65016,
  );
}
