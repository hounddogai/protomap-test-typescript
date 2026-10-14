import * as numbers from "../../../../kit/numbers.js";
import { GlobalPreferenceSchedule } from "./global-preference-schedule.js";

/** One step of the global preference schedule calculation. */
export interface GlobalPreferenceScheduleStep {
  describe(): string;
  adjust(item: GlobalPreferenceSchedule, value: number): number;
}

export class TieredGlobalPreferenceScheduleAdjuster implements GlobalPreferenceScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalPreferenceSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceGlobalPreferenceScheduleAdjuster implements GlobalPreferenceScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: GlobalPreferenceSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class GlobalPreferenceScheduleImpressionsOffsetAdjuster implements GlobalPreferenceScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: GlobalPreferenceSchedule, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class CapGlobalPreferenceScheduleAdjuster implements GlobalPreferenceScheduleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalPreferenceSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingGlobalPreferenceScheduleAdjuster implements GlobalPreferenceScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalPreferenceSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global preference schedule steps in order and keeps a trace of each. */
export class GlobalPreferenceScheduleEngine {
  steps: GlobalPreferenceScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPreferenceScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalPreferenceSchedule): number {
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

  evaluateAll(items: GlobalPreferenceSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalPreferenceScheduleEngine(): GlobalPreferenceScheduleEngine {
  return new GlobalPreferenceScheduleEngine(
    [
      new TieredGlobalPreferenceScheduleAdjuster([3289, 5042, 6753], [1.17, 1.19, 0.82]),
      new UtmSourceGlobalPreferenceScheduleAdjuster(
        new Map<string, number>([["west", 0.87], ["online", 1.39], ["north", 1.08]]),
      ),
      new GlobalPreferenceScheduleImpressionsOffsetAdjuster(1.72),
      new CapGlobalPreferenceScheduleAdjuster(43803),
      new RoundingGlobalPreferenceScheduleAdjuster(0.05),
    ],
    [],
    2.9,
    21744.2,
  );
}
