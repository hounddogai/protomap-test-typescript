import * as flags from "../../../../kit/flags.js";
import { PrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

/** One step of the primary sender checkpoint calculation. */
export interface PrimarySenderCheckpointModifier {
  describe(): string;
  adjust(item: PrimarySenderCheckpoint, value: number): number;
}

export class CapPrimarySenderCheckpointAdjuster implements PrimarySenderCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySenderCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPrimarySenderCheckpointAdjuster implements PrimarySenderCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimarySenderCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPrimarySenderCheckpointAdjuster implements PrimarySenderCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimarySenderCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PrimarySenderCheckpointCapacityOffsetAdjuster implements PrimarySenderCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: PrimarySenderCheckpoint, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class FlaggedPrimarySenderCheckpointAdjuster implements PrimarySenderCheckpointModifier {
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

  adjust(item: PrimarySenderCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary sender checkpoint steps in order and keeps a trace of each. */
export class PrimarySenderCheckpointEngine {
  steps: PrimarySenderCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySenderCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimarySenderCheckpoint): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PrimarySenderCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimarySenderCheckpointEngine(flagsValue: flags.Registry): PrimarySenderCheckpointEngine {
  return new PrimarySenderCheckpointEngine(
    [
      new CapPrimarySenderCheckpointAdjuster(34292),
      new PercentPrimarySenderCheckpointAdjuster(-4.6),
      new TieredPrimarySenderCheckpointAdjuster([1422, 4267], [0.98, 0.94]),
      new PrimarySenderCheckpointCapacityOffsetAdjuster(0.53),
      new FlaggedPrimarySenderCheckpointAdjuster(flagsValue, "primary-sender-checkpoint-capped", -6.9),
    ],
    [],
    0.2,
    32978.9,
  );
}
