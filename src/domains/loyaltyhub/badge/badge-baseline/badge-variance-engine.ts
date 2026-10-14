import * as flags from "../../../../kit/flags.js";
import { BadgeVariance } from "./badge-variance.js";

/** One step of the badge variance calculation. */
export interface BadgeVarianceModifier {
  describe(): string;
  adjust(item: BadgeVariance, value: number): number;
}

export class NameBadgeVarianceAdjuster implements BadgeVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BadgeVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBadgeVarianceAdjuster implements BadgeVarianceModifier {
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

  adjust(item: BadgeVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredBadgeVarianceAdjuster implements BadgeVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBadgeVarianceAdjuster implements BadgeVarianceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BadgeVarianceImpressionsOffsetAdjuster implements BadgeVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: BadgeVariance, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the badge variance steps in order and keeps a trace of each. */
export class BadgeVarianceEngine {
  steps: BadgeVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BadgeVariance): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: BadgeVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBadgeVarianceEngine(flagsValue: flags.Registry): BadgeVarianceEngine {
  return new BadgeVarianceEngine(
    [
      new NameBadgeVarianceAdjuster(new Map<string, number>([["north", 0.77]])),
      new FlaggedBadgeVarianceAdjuster(flagsValue, "badge-variance-global", -8.9),
      new TieredBadgeVarianceAdjuster([1647, 2626, 5639, 9035], [0.98, 1.19, 0.99, 1.05]),
      new MinimumBadgeVarianceAdjuster(21.2),
      new BadgeVarianceImpressionsOffsetAdjuster(0.33),
    ],
    [],
    0.6,
    30261.2,
  );
}
