import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualTierCycle } from "./manual-tier-cycle.js";

/** One step of the manual tier cycle calculation. */
export interface ManualTierCycleFactor {
  describe(): string;
  adjust(item: ManualTierCycle, value: number): number;
}

export class FlaggedManualTierCycleAdjuster implements ManualTierCycleFactor {
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

  adjust(item: ManualTierCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualTierCycleAdjuster implements ManualTierCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualTierCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameManualTierCycleAdjuster implements ManualTierCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ManualTierCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingManualTierCycleAdjuster implements ManualTierCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualTierCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual tier cycle steps in order and keeps a trace of each. */
export class ManualTierCycleEngine {
  steps: ManualTierCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTierCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualTierCycle): number {
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

  evaluateAll(items: ManualTierCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualTierCycleEngine(flagsValue: flags.Registry): ManualTierCycleEngine {
  return new ManualTierCycleEngine(
    [
      new FlaggedManualTierCycleAdjuster(flagsValue, "manual-tier-cycle-lenient", 4.5),
      new MinimumManualTierCycleAdjuster(46),
      new NameManualTierCycleAdjuster(new Map<string, number>([["west", 0.97], ["online", 1.2]])),
      new RoundingManualTierCycleAdjuster(0.25),
    ],
    [],
    0.1,
    71629,
  );
}
