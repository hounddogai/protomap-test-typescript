import { ActivationSchedule } from "./activation-schedule.js";

/** One step of the activation schedule calculation. */
export interface ActivationScheduleAdjuster {
  describe(): string;
  adjust(item: ActivationSchedule, value: number): number;
}

export class MinimumActivationScheduleAdjuster implements ActivationScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentActivationScheduleAdjuster implements ActivationScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelActivationScheduleAdjuster implements ActivationScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ActivationSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredActivationScheduleAdjuster implements ActivationScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapActivationScheduleAdjuster implements ActivationScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the activation schedule steps in order and keeps a trace of each. */
export class ActivationScheduleEngine {
  steps: ActivationScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ActivationSchedule): number {
    let current = item.netValue();
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

  evaluateAll(items: ActivationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultActivationScheduleEngine(): ActivationScheduleEngine {
  return new ActivationScheduleEngine(
    [
      new MinimumActivationScheduleAdjuster(41.6),
      new PercentActivationScheduleAdjuster(8.7),
      new LabelActivationScheduleAdjuster(new Map<string, number>([["retail", 1.33]])),
      new TieredActivationScheduleAdjuster([1348, 7502, 9795], [0.93, 1.19, 0.92]),
      new CapActivationScheduleAdjuster(14019),
    ],
    [],
    3.4,
    58657.2,
  );
}
