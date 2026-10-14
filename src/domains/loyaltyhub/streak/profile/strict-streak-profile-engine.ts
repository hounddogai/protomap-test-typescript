import * as numbers from "../../../../kit/numbers.js";
import { StrictStreakProfile } from "./strict-streak-profile.js";

/** One step of the strict streak profile calculation. */
export interface StrictStreakProfileAdjuster {
  describe(): string;
  adjust(item: StrictStreakProfile, value: number): number;
}

export class MinimumStrictStreakProfileAdjuster implements StrictStreakProfileAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictStreakProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStrictStreakProfileAdjuster implements StrictStreakProfileAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictStreakProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictStreakProfileAdjuster implements StrictStreakProfileAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictStreakProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UtmSourceStrictStreakProfileAdjuster implements StrictStreakProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: StrictStreakProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentStrictStreakProfileAdjuster implements StrictStreakProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictStreakProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class StrictStreakProfileCapacityOffsetAdjuster implements StrictStreakProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: StrictStreakProfile, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the strict streak profile steps in order and keeps a trace of each. */
export class StrictStreakProfileEngine {
  steps: StrictStreakProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictStreakProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictStreakProfile): number {
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

  evaluateAll(items: StrictStreakProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictStreakProfileEngine(): StrictStreakProfileEngine {
  return new StrictStreakProfileEngine(
    [
      new MinimumStrictStreakProfileAdjuster(6.8),
      new CapStrictStreakProfileAdjuster(31165),
      new RoundingStrictStreakProfileAdjuster(0.05),
      new UtmSourceStrictStreakProfileAdjuster(
        new Map<string, number>([["central", 1.15], ["east", 1.03], ["north", 1.12]]),
      ),
      new PercentStrictStreakProfileAdjuster(1.9),
      new StrictStreakProfileCapacityOffsetAdjuster(1.94),
    ],
    [],
    3.2,
    9363.9,
  );
}
