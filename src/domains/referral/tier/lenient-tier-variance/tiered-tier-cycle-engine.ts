import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredTierCycle } from "./tiered-tier-cycle.js";

/** One step of the tiered tier cycle calculation. */
export interface TieredTierCycleStep {
  describe(): string;
  adjust(item: TieredTierCycle, value: number): number;
}

export class TieredTieredTierCycleAdjuster implements TieredTierCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredTierCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredTierCycleEndsAtOffsetAdjuster implements TieredTierCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: TieredTierCycle, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class FlaggedTieredTierCycleAdjuster implements TieredTierCycleStep {
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

  adjust(item: TieredTierCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredTierCycleAdjuster implements TieredTierCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredTierCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredTierCycleAdjuster implements TieredTierCycleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredTierCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTieredTierCycleAdjuster implements TieredTierCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredTierCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered tier cycle steps in order and keeps a trace of each. */
export class TieredTierCycleEngine {
  steps: TieredTierCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredTierCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredTierCycle): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: TieredTierCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredTierCycleEngine(flagsValue: flags.Registry): TieredTierCycleEngine {
  return new TieredTierCycleEngine(
    [
      new TieredTieredTierCycleAdjuster([720, 1764, 4149], [1.16, 1.19, 1.11]),
      new TieredTierCycleEndsAtOffsetAdjuster(1.84),
      new FlaggedTieredTierCycleAdjuster(flagsValue, "tiered-tier-cycle-capped", -7.4),
      new RoundingTieredTierCycleAdjuster(0.25),
      new MinimumTieredTierCycleAdjuster(25.1),
      new CapTieredTierCycleAdjuster(49629),
    ],
    [],
    3.9,
    70648.3,
  );
}
