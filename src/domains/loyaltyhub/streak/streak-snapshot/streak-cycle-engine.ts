import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StreakCycle } from "./streak-cycle.js";

/** One step of the streak cycle calculation. */
export interface StreakCycleAdjuster {
  describe(): string;
  adjust(item: StreakCycle, value: number): number;
}

export class NameStreakCycleAdjuster implements StreakCycleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StreakCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapStreakCycleAdjuster implements StreakCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StreakCycleThresholdOffsetAdjuster implements StreakCycleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: StreakCycle, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class FlaggedStreakCycleAdjuster implements StreakCycleAdjuster {
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

  adjust(item: StreakCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStreakCycleAdjuster implements StreakCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the streak cycle steps in order and keeps a trace of each. */
export class StreakCycleEngine {
  steps: StreakCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StreakCycle): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: StreakCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStreakCycleEngine(flagsValue: flags.Registry): StreakCycleEngine {
  return new StreakCycleEngine(
    [
      new NameStreakCycleAdjuster(
        new Map<string, number>([["retail", 1.17], ["south", 1.01], ["online", 0.96]]),
      ),
      new CapStreakCycleAdjuster(47661),
      new StreakCycleThresholdOffsetAdjuster(0.34),
      new FlaggedStreakCycleAdjuster(flagsValue, "streak-cycle-tiered", 1.9),
      new PercentStreakCycleAdjuster(17.4),
    ],
    [],
    1.1,
    22107,
  );
}
