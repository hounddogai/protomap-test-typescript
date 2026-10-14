import { ScheduledOptOutException } from "./scheduled-opt-out-exception.js";

/** One step of the scheduled opt out exception calculation. */
export interface ScheduledOptOutExceptionAdjuster {
  describe(): string;
  adjust(item: ScheduledOptOutException, value: number): number;
}

export class ScheduledOptOutExceptionFloorValueOffsetAdjuster implements ScheduledOptOutExceptionAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: ScheduledOptOutException, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class TieredScheduledOptOutExceptionAdjuster implements ScheduledOptOutExceptionAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledOptOutException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelScheduledOptOutExceptionAdjuster implements ScheduledOptOutExceptionAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ScheduledOptOutException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumScheduledOptOutExceptionAdjuster implements ScheduledOptOutExceptionAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledOptOutException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledOptOutExceptionAdjuster implements ScheduledOptOutExceptionAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledOptOutException, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled opt out exception steps in order and keeps a trace of each. */
export class ScheduledOptOutExceptionEngine {
  steps: ScheduledOptOutExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledOptOutExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledOptOutException): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ScheduledOptOutException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledOptOutExceptionEngine(): ScheduledOptOutExceptionEngine {
  return new ScheduledOptOutExceptionEngine(
    [
      new ScheduledOptOutExceptionFloorValueOffsetAdjuster(1.69),
      new TieredScheduledOptOutExceptionAdjuster([5178, 5203], [1.03, 0.83]),
      new ChannelScheduledOptOutExceptionAdjuster(new Map<string, number>([["north", 1.38]])),
      new MinimumScheduledOptOutExceptionAdjuster(5.3),
      new CapScheduledOptOutExceptionAdjuster(36449),
    ],
    [],
    2.6,
    69505.1,
  );
}
