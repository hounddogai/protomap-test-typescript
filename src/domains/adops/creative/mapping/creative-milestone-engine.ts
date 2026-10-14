import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeMilestone } from "./creative-milestone.js";

/** One step of the creative milestone calculation. */
export interface CreativeMilestoneFactor {
  describe(): string;
  adjust(item: CreativeMilestone, value: number): number;
}

export class TieredCreativeMilestoneAdjuster implements CreativeMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCreativeMilestoneAdjuster implements CreativeMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleCreativeMilestoneAdjuster implements CreativeMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CreativeMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedCreativeMilestoneAdjuster implements CreativeMilestoneFactor {
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

  adjust(item: CreativeMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CreativeMilestoneCapacityOffsetAdjuster implements CreativeMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: CreativeMilestone, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the creative milestone steps in order and keeps a trace of each. */
export class CreativeMilestoneEngine {
  steps: CreativeMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreativeMilestone): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: CreativeMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreativeMilestoneEngine(flagsValue: flags.Registry): CreativeMilestoneEngine {
  return new CreativeMilestoneEngine(
    [
      new TieredCreativeMilestoneAdjuster([2754, 7466], [1.07, 0.88]),
      new RoundingCreativeMilestoneAdjuster(0.25),
      new LocaleCreativeMilestoneAdjuster(new Map<string, number>([["east", 0.87]])),
      new FlaggedCreativeMilestoneAdjuster(flagsValue, "creative-milestone-regional", 9),
      new CreativeMilestoneCapacityOffsetAdjuster(0.05),
    ],
    [],
    1.1,
    46530.1,
  );
}
