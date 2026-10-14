import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredBounceMilestone } from "./tiered-bounce-milestone.js";

/** One step of the tiered bounce milestone calculation. */
export interface TieredBounceMilestoneModifier {
  describe(): string;
  adjust(item: TieredBounceMilestone, value: number): number;
}

export class TieredTieredBounceMilestoneAdjuster implements TieredBounceMilestoneModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredBounceMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredBounceMilestoneAdjuster implements TieredBounceMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredBounceMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTieredBounceMilestoneAdjuster implements TieredBounceMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBounceMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBounceMilestonePriorityOffsetAdjuster implements TieredBounceMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: TieredBounceMilestone, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedTieredBounceMilestoneAdjuster implements TieredBounceMilestoneModifier {
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

  adjust(item: TieredBounceMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredBounceMilestoneAdjuster implements TieredBounceMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBounceMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered bounce milestone steps in order and keeps a trace of each. */
export class TieredBounceMilestoneEngine {
  steps: TieredBounceMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBounceMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredBounceMilestone): number {
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

  evaluateAll(items: TieredBounceMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredBounceMilestoneEngine(flagsValue: flags.Registry): TieredBounceMilestoneEngine {
  return new TieredBounceMilestoneEngine(
    [
      new TieredTieredBounceMilestoneAdjuster([186, 4825, 6187], [0.98, 0.82, 0.91]),
      new MinimumTieredBounceMilestoneAdjuster(28.7),
      new RoundingTieredBounceMilestoneAdjuster(5),
      new TieredBounceMilestonePriorityOffsetAdjuster(1.25),
      new FlaggedTieredBounceMilestoneAdjuster(flagsValue, "tiered-bounce-milestone-batched", 2.4),
      new CapTieredBounceMilestoneAdjuster(37672),
    ],
    [],
    2.9,
    76311.7,
  );
}
