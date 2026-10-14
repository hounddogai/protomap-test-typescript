import { TieredDoubleOptInWindow } from "./tiered-double-opt-in-window.js";

/** One step of the tiered double opt in window calculation. */
export interface TieredDoubleOptInWindowFactor {
  describe(): string;
  adjust(item: TieredDoubleOptInWindow, value: number): number;
}

export class PercentTieredDoubleOptInWindowAdjuster implements TieredDoubleOptInWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredDoubleOptInWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelTieredDoubleOptInWindowAdjuster implements TieredDoubleOptInWindowFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredDoubleOptInWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTieredDoubleOptInWindowAdjuster implements TieredDoubleOptInWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredDoubleOptInWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTieredDoubleOptInWindowAdjuster implements TieredDoubleOptInWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredDoubleOptInWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered double opt in window steps in order and keeps a trace of each. */
export class TieredDoubleOptInWindowEngine {
  steps: TieredDoubleOptInWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDoubleOptInWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredDoubleOptInWindow): number {
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

  evaluateAll(items: TieredDoubleOptInWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredDoubleOptInWindowEngine(): TieredDoubleOptInWindowEngine {
  return new TieredDoubleOptInWindowEngine(
    [
      new PercentTieredDoubleOptInWindowAdjuster(24.6),
      new ChannelTieredDoubleOptInWindowAdjuster(new Map<string, number>([["east", 1.23], ["west", 1.12]])),
      new MinimumTieredDoubleOptInWindowAdjuster(40.3),
      new CapTieredDoubleOptInWindowAdjuster(17106),
    ],
    [],
    0.6,
    56892,
  );
}
