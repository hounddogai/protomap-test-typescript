import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingJourneyTarget } from "./rolling-journey-target.js";

/** One step of the rolling journey target calculation. */
export interface RollingJourneyTargetStep {
  describe(): string;
  adjust(item: RollingJourneyTarget, value: number): number;
}

export class FlaggedRollingJourneyTargetAdjuster implements RollingJourneyTargetStep {
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

  adjust(item: RollingJourneyTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingJourneyTargetRetriesOffsetAdjuster implements RollingJourneyTargetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: RollingJourneyTarget, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class RoundingRollingJourneyTargetAdjuster implements RollingJourneyTargetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingJourneyTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingJourneyTargetAdjuster implements RollingJourneyTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingJourneyTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling journey target steps in order and keeps a trace of each. */
export class RollingJourneyTargetEngine {
  steps: RollingJourneyTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingJourneyTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingJourneyTarget): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: RollingJourneyTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingJourneyTargetEngine(flagsValue: flags.Registry): RollingJourneyTargetEngine {
  return new RollingJourneyTargetEngine(
    [
      new FlaggedRollingJourneyTargetAdjuster(flagsValue, "rolling-journey-target-batched", -1.6),
      new RollingJourneyTargetRetriesOffsetAdjuster(0.24),
      new RoundingRollingJourneyTargetAdjuster(0.25),
      new MinimumRollingJourneyTargetAdjuster(23.2),
    ],
    [],
    4.1,
    28831.1,
  );
}
