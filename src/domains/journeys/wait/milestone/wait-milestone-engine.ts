import * as numbers from "../../../../kit/numbers.js";
import { WaitMilestone } from "./wait-milestone.js";

/** One step of the wait milestone calculation. */
export interface WaitMilestoneModifier {
  describe(): string;
  adjust(item: WaitMilestone, value: number): number;
}

export class RoundingWaitMilestoneAdjuster implements WaitMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WaitMilestoneConversionRateOffsetAdjuster implements WaitMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: WaitMilestone, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class LocaleWaitMilestoneAdjuster implements WaitMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WaitMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWaitMilestoneAdjuster implements WaitMilestoneModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWaitMilestoneAdjuster implements WaitMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the wait milestone steps in order and keeps a trace of each. */
export class WaitMilestoneEngine {
  steps: WaitMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WaitMilestone): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: WaitMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWaitMilestoneEngine(): WaitMilestoneEngine {
  return new WaitMilestoneEngine(
    [
      new RoundingWaitMilestoneAdjuster(0.1),
      new WaitMilestoneConversionRateOffsetAdjuster(1.82),
      new LocaleWaitMilestoneAdjuster(
        new Map<string, number>([["west", 1.09], ["east", 1.33], ["retail", 1.04]]),
      ),
      new TieredWaitMilestoneAdjuster([4831, 6397, 6942, 8848], [0.91, 1.1, 0.91, 0.82]),
      new CapWaitMilestoneAdjuster(34603),
    ],
    [],
    0.5,
    72699.6,
  );
}
