import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CohortCycle } from "./cohort-cycle.js";

/** One step of the cohort cycle calculation. */
export interface CohortCycleStep {
  describe(): string;
  adjust(item: CohortCycle, value: number): number;
}

export class PercentCohortCycleAdjuster implements CohortCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCohortCycleAdjuster implements CohortCycleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedCohortCycleAdjuster implements CohortCycleStep {
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

  adjust(item: CohortCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCohortCycleAdjuster implements CohortCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CohortCycleWindowDaysOffsetAdjuster implements CohortCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: CohortCycle, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingCohortCycleAdjuster implements CohortCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the cohort cycle steps in order and keeps a trace of each. */
export class CohortCycleEngine {
  steps: CohortCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortCycle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CohortCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortCycleEngine(flagsValue: flags.Registry): CohortCycleEngine {
  return new CohortCycleEngine(
    [
      new PercentCohortCycleAdjuster(-11.4),
      new MinimumCohortCycleAdjuster(31.9),
      new FlaggedCohortCycleAdjuster(flagsValue, "cohort-cycle-batched", 1.5),
      new TieredCohortCycleAdjuster([627, 1225, 3902], [0.93, 1.14, 1.1]),
      new CohortCycleWindowDaysOffsetAdjuster(1.1),
      new RoundingCohortCycleAdjuster(0.05),
    ],
    [],
    1.6,
    82628.9,
  );
}
