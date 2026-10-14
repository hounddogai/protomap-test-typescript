import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredCohortAdjustment } from "./tiered-cohort-adjustment.js";

/** One step of the tiered cohort adjustment calculation. */
export interface TieredCohortAdjustmentFactor {
  describe(): string;
  adjust(item: TieredCohortAdjustment, value: number): number;
}

export class PercentTieredCohortAdjustmentAdjuster implements TieredCohortAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredCohortAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredCohortAdjustmentAdjuster implements TieredCohortAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredCohortAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedTieredCohortAdjustmentAdjuster implements TieredCohortAdjustmentFactor {
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

  adjust(item: TieredCohortAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredCohortAdjustmentAdjuster implements TieredCohortAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredCohortAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredCohortAdjustmentAdjuster implements TieredCohortAdjustmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredCohortAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCohortAdjustmentCreatedAtOffsetAdjuster implements TieredCohortAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: TieredCohortAdjustment, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the tiered cohort adjustment steps in order and keeps a trace of each. */
export class TieredCohortAdjustmentEngine {
  steps: TieredCohortAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredCohortAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredCohortAdjustment): number {
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

  evaluateAll(items: TieredCohortAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredCohortAdjustmentEngine(flagsValue: flags.Registry): TieredCohortAdjustmentEngine {
  return new TieredCohortAdjustmentEngine(
    [
      new PercentTieredCohortAdjustmentAdjuster(11.2),
      new TieredTieredCohortAdjustmentAdjuster([881, 6672], [0.96, 0.97]),
      new FlaggedTieredCohortAdjustmentAdjuster(flagsValue, "tiered-cohort-adjustment-batched", -2.9),
      new CapTieredCohortAdjustmentAdjuster(8126),
      new RoundingTieredCohortAdjustmentAdjuster(1),
      new TieredCohortAdjustmentCreatedAtOffsetAdjuster(0.47),
    ],
    [],
    4.1,
    41032.6,
  );
}
