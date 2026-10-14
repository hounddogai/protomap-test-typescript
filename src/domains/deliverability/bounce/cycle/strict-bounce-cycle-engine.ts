import { StrictBounceCycle } from "./strict-bounce-cycle.js";

/** One step of the strict bounce cycle calculation. */
export interface StrictBounceCycleFactor {
  describe(): string;
  adjust(item: StrictBounceCycle, value: number): number;
}

export class TieredStrictBounceCycleAdjuster implements StrictBounceCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictBounceCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStrictBounceCycleAdjuster implements StrictBounceCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictBounceCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictBounceCycleAdjuster implements StrictBounceCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictBounceCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceStrictBounceCycleAdjuster implements StrictBounceCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: StrictBounceCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict bounce cycle steps in order and keeps a trace of each. */
export class StrictBounceCycleEngine {
  steps: StrictBounceCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictBounceCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictBounceCycle): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: StrictBounceCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictBounceCycleEngine(): StrictBounceCycleEngine {
  return new StrictBounceCycleEngine(
    [
      new TieredStrictBounceCycleAdjuster([7026, 7118, 7134, 8860], [0.92, 0.92, 1.13, 0.87]),
      new CapStrictBounceCycleAdjuster(41879),
      new PercentStrictBounceCycleAdjuster(8.1),
      new UtmSourceStrictBounceCycleAdjuster(new Map<string, number>([["west", 0.91]])),
    ],
    [],
    3.6,
    85717,
  );
}
