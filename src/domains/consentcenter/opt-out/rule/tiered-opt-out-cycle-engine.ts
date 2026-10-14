import * as flags from "../../../../kit/flags.js";
import { TieredOptOutCycle } from "./tiered-opt-out-cycle.js";

/** One step of the tiered opt out cycle calculation. */
export interface TieredOptOutCycleAdjuster {
  describe(): string;
  adjust(item: TieredOptOutCycle, value: number): number;
}

export class TieredOptOutCycleQuantityOffsetAdjuster implements TieredOptOutCycleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: TieredOptOutCycle, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class CapTieredOptOutCycleAdjuster implements TieredOptOutCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredOptOutCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTieredOptOutCycleAdjuster implements TieredOptOutCycleAdjuster {
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

  adjust(item: TieredOptOutCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered opt out cycle steps in order and keeps a trace of each. */
export class TieredOptOutCycleEngine {
  steps: TieredOptOutCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredOptOutCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredOptOutCycle): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: TieredOptOutCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredOptOutCycleEngine(flagsValue: flags.Registry): TieredOptOutCycleEngine {
  return new TieredOptOutCycleEngine(
    [
      new TieredOptOutCycleQuantityOffsetAdjuster(1.88),
      new CapTieredOptOutCycleAdjuster(5770),
      new FlaggedTieredOptOutCycleAdjuster(flagsValue, "tiered-opt-out-cycle-adaptive", 6.6),
    ],
    [],
    3.4,
    61226.3,
  );
}
