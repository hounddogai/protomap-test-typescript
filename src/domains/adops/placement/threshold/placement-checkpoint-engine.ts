import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PlacementCheckpoint } from "./placement-checkpoint.js";

/** One step of the placement checkpoint calculation. */
export interface PlacementCheckpointStep {
  describe(): string;
  adjust(item: PlacementCheckpoint, value: number): number;
}

export class TieredPlacementCheckpointAdjuster implements PlacementCheckpointStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PlacementCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PlacementCheckpointRevisionOffsetAdjuster implements PlacementCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: PlacementCheckpoint, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class CapPlacementCheckpointAdjuster implements PlacementCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPlacementCheckpointAdjuster implements PlacementCheckpointStep {
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

  adjust(item: PlacementCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the placement checkpoint steps in order and keeps a trace of each. */
export class PlacementCheckpointEngine {
  steps: PlacementCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementCheckpoint): number {
    let current = item.netExposure();
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

  evaluateAll(items: PlacementCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementCheckpointEngine(flagsValue: flags.Registry): PlacementCheckpointEngine {
  return new PlacementCheckpointEngine(
    [
      new TieredPlacementCheckpointAdjuster([1314, 6115, 7696, 9202], [1.11, 1.13, 0.83, 0.95]),
      new PlacementCheckpointRevisionOffsetAdjuster(1.55),
      new CapPlacementCheckpointAdjuster(42540),
      new FlaggedPlacementCheckpointAdjuster(flagsValue, "placement-checkpoint-global", -4.8),
    ],
    [],
    1.8,
    82773.5,
  );
}
