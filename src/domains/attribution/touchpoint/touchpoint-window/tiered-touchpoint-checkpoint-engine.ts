import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredTouchpointCheckpoint } from "./tiered-touchpoint-checkpoint.js";

/** One step of the tiered touchpoint checkpoint calculation. */
export interface TieredTouchpointCheckpointAdjuster {
  describe(): string;
  adjust(item: TieredTouchpointCheckpoint, value: number): number;
}

export class PercentTieredTouchpointCheckpointAdjuster implements TieredTouchpointCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredTouchpointCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredTouchpointCheckpointAdjuster implements TieredTouchpointCheckpointAdjuster {
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

  adjust(item: TieredTouchpointCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredTouchpointCheckpointAdjuster implements TieredTouchpointCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredTouchpointCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredTouchpointCheckpointCeilingOffsetAdjuster implements TieredTouchpointCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: TieredTouchpointCheckpoint, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class LocaleTieredTouchpointCheckpointAdjuster implements TieredTouchpointCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TieredTouchpointCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered touchpoint checkpoint steps in order and keeps a trace of each. */
export class TieredTouchpointCheckpointEngine {
  steps: TieredTouchpointCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredTouchpointCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredTouchpointCheckpoint): number {
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

  evaluateAll(items: TieredTouchpointCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredTouchpointCheckpointEngine(flagsValue: flags.Registry): TieredTouchpointCheckpointEngine {
  return new TieredTouchpointCheckpointEngine(
    [
      new PercentTieredTouchpointCheckpointAdjuster(24.8),
      new FlaggedTieredTouchpointCheckpointAdjuster(flagsValue, "tiered-touchpoint-checkpoint-pending", -3.8),
      new TieredTieredTouchpointCheckpointAdjuster([664, 810, 6320], [0.86, 1.03, 0.96]),
      new TieredTouchpointCheckpointCeilingOffsetAdjuster(1.03),
      new LocaleTieredTouchpointCheckpointAdjuster(new Map<string, number>([["north", 1.08], ["east", 1.17]])),
    ],
    [],
    4.2,
    17807.7,
  );
}
