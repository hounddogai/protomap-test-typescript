import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CsatCheckpoint } from "./csat-checkpoint.js";

/** One step of the csat checkpoint calculation. */
export interface CsatCheckpointModifier {
  describe(): string;
  adjust(item: CsatCheckpoint, value: number): number;
}

export class CsatCheckpointRateOffsetAdjuster implements CsatCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: CsatCheckpoint, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class FlaggedCsatCheckpointAdjuster implements CsatCheckpointModifier {
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

  adjust(item: CsatCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCsatCheckpointAdjuster implements CsatCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCsatCheckpointAdjuster implements CsatCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredCsatCheckpointAdjuster implements CsatCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the csat checkpoint steps in order and keeps a trace of each. */
export class CsatCheckpointEngine {
  steps: CsatCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CsatCheckpoint): number {
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

  evaluateAll(items: CsatCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCsatCheckpointEngine(flagsValue: flags.Registry): CsatCheckpointEngine {
  return new CsatCheckpointEngine(
    [
      new CsatCheckpointRateOffsetAdjuster(1),
      new FlaggedCsatCheckpointAdjuster(flagsValue, "csat-checkpoint-pending", 0.2),
      new RoundingCsatCheckpointAdjuster(0.25),
      new MinimumCsatCheckpointAdjuster(49.3),
      new TieredCsatCheckpointAdjuster([2879, 7042], [0.84, 0.97]),
    ],
    [],
    1,
    9324.4,
  );
}
