import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalStepCycle } from "./seasonal-step-cycle.js";

/** One step of the seasonal step cycle calculation. */
export interface SeasonalStepCycleFactor {
  describe(): string;
  adjust(item: SeasonalStepCycle, value: number): number;
}

export class FlaggedSeasonalStepCycleAdjuster implements SeasonalStepCycleFactor {
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

  adjust(item: SeasonalStepCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalStepCycleWindowDaysOffsetAdjuster implements SeasonalStepCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: SeasonalStepCycle, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class MinimumSeasonalStepCycleAdjuster implements SeasonalStepCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalStepCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSeasonalStepCycleAdjuster implements SeasonalStepCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalStepCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal step cycle steps in order and keeps a trace of each. */
export class SeasonalStepCycleEngine {
  steps: SeasonalStepCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalStepCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalStepCycle): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SeasonalStepCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalStepCycleEngine(flagsValue: flags.Registry): SeasonalStepCycleEngine {
  return new SeasonalStepCycleEngine(
    [
      new FlaggedSeasonalStepCycleAdjuster(flagsValue, "seasonal-step-cycle-primary", 4.8),
      new SeasonalStepCycleWindowDaysOffsetAdjuster(0.93),
      new MinimumSeasonalStepCycleAdjuster(6.4),
      new RoundingSeasonalStepCycleAdjuster(0.05),
    ],
    [],
    2.1,
    72958.5,
  );
}
