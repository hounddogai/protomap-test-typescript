import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingJourneyBaseline } from "./rolling-journey-baseline.js";

/** One step of the rolling journey baseline calculation. */
export interface RollingJourneyBaselineStep {
  describe(): string;
  adjust(item: RollingJourneyBaseline, value: number): number;
}

export class RoundingRollingJourneyBaselineAdjuster implements RollingJourneyBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingJourneyBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRollingJourneyBaselineAdjuster implements RollingJourneyBaselineStep {
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

  adjust(item: RollingJourneyBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingJourneyBaselineMinimumOffsetAdjuster implements RollingJourneyBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: RollingJourneyBaseline, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class TieredRollingJourneyBaselineAdjuster implements RollingJourneyBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingJourneyBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRollingJourneyBaselineAdjuster implements RollingJourneyBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingJourneyBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling journey baseline steps in order and keeps a trace of each. */
export class RollingJourneyBaselineEngine {
  steps: RollingJourneyBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingJourneyBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingJourneyBaseline): number {
    let current = item.netValue();
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

  evaluateAll(items: RollingJourneyBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingJourneyBaselineEngine(flagsValue: flags.Registry): RollingJourneyBaselineEngine {
  return new RollingJourneyBaselineEngine(
    [
      new RoundingRollingJourneyBaselineAdjuster(1),
      new FlaggedRollingJourneyBaselineAdjuster(flagsValue, "rolling-journey-baseline-capped", -9),
      new RollingJourneyBaselineMinimumOffsetAdjuster(1.57),
      new TieredRollingJourneyBaselineAdjuster([5546, 8420], [1.07, 1.18]),
      new PercentRollingJourneyBaselineAdjuster(13.6),
    ],
    [],
    1.4,
    39588.1,
  );
}
