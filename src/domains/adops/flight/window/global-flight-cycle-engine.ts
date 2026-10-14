import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalFlightCycle } from "./global-flight-cycle.js";

/** One step of the global flight cycle calculation. */
export interface GlobalFlightCycleFactor {
  describe(): string;
  adjust(item: GlobalFlightCycle, value: number): number;
}

export class FlaggedGlobalFlightCycleAdjuster implements GlobalFlightCycleFactor {
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

  adjust(item: GlobalFlightCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalFlightCycleAdjuster implements GlobalFlightCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalFlightCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingGlobalFlightCycleAdjuster implements GlobalFlightCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalFlightCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class GlobalFlightCycleBatchSizeOffsetAdjuster implements GlobalFlightCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: GlobalFlightCycle, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class CapGlobalFlightCycleAdjuster implements GlobalFlightCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalFlightCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumGlobalFlightCycleAdjuster implements GlobalFlightCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalFlightCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global flight cycle steps in order and keeps a trace of each. */
export class GlobalFlightCycleEngine {
  steps: GlobalFlightCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalFlightCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalFlightCycle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: GlobalFlightCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalFlightCycleEngine(flagsValue: flags.Registry): GlobalFlightCycleEngine {
  return new GlobalFlightCycleEngine(
    [
      new FlaggedGlobalFlightCycleAdjuster(flagsValue, "global-flight-cycle-primary", 9.1),
      new TieredGlobalFlightCycleAdjuster([1693, 1946, 7933], [1.11, 1.15, 0.96]),
      new RoundingGlobalFlightCycleAdjuster(0.1),
      new GlobalFlightCycleBatchSizeOffsetAdjuster(0.25),
      new CapGlobalFlightCycleAdjuster(30346),
      new MinimumGlobalFlightCycleAdjuster(34.1),
    ],
    [],
    3.9,
    42579.9,
  );
}
