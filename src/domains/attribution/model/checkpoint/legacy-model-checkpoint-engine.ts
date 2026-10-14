import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyModelCheckpoint } from "./legacy-model-checkpoint.js";

/** One step of the legacy model checkpoint calculation. */
export interface LegacyModelCheckpointModifier {
  describe(): string;
  adjust(item: LegacyModelCheckpoint, value: number): number;
}

export class CapLegacyModelCheckpointAdjuster implements LegacyModelCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyModelCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLegacyModelCheckpointAdjuster implements LegacyModelCheckpointModifier {
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

  adjust(item: LegacyModelCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LegacyModelCheckpointMinimumOffsetAdjuster implements LegacyModelCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: LegacyModelCheckpoint, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class TieredLegacyModelCheckpointAdjuster implements LegacyModelCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyModelCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy model checkpoint steps in order and keeps a trace of each. */
export class LegacyModelCheckpointEngine {
  steps: LegacyModelCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyModelCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyModelCheckpoint): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: LegacyModelCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyModelCheckpointEngine(flagsValue: flags.Registry): LegacyModelCheckpointEngine {
  return new LegacyModelCheckpointEngine(
    [
      new CapLegacyModelCheckpointAdjuster(4087),
      new FlaggedLegacyModelCheckpointAdjuster(flagsValue, "legacy-model-checkpoint-primary", 2),
      new LegacyModelCheckpointMinimumOffsetAdjuster(0.69),
      new TieredLegacyModelCheckpointAdjuster([6746, 7527], [0.84, 1.2]),
    ],
    [],
    0.6,
    61551.8,
  );
}
