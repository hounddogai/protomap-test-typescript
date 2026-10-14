import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceMilestone } from "./bounce-milestone.js";

/** One step of the bounce milestone calculation. */
export interface BounceMilestoneStep {
  describe(): string;
  adjust(item: BounceMilestone, value: number): number;
}

export class UnitBounceMilestoneAdjuster implements BounceMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: BounceMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBounceMilestoneAdjuster implements BounceMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BounceMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBounceMilestoneAdjuster implements BounceMilestoneStep {
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

  adjust(item: BounceMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bounce milestone steps in order and keeps a trace of each. */
export class BounceMilestoneEngine {
  steps: BounceMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BounceMilestone): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: BounceMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBounceMilestoneEngine(flagsValue: flags.Registry): BounceMilestoneEngine {
  return new BounceMilestoneEngine(
    [
      new UnitBounceMilestoneAdjuster(
        new Map<string, number>([["south", 0.98], ["online", 1.2], ["north", 1.17]]),
      ),
      new TieredBounceMilestoneAdjuster([1397, 1648, 1940, 6184], [0.93, 0.93, 1.08, 1.11]),
      new FlaggedBounceMilestoneAdjuster(flagsValue, "bounce-milestone-scheduled", 0.3),
    ],
    [],
    4,
    5004.2,
  );
}
