import * as numbers from "../../../../kit/numbers.js";
import { CreativeSchedule } from "./creative-schedule.js";

/** One step of the creative schedule calculation. */
export interface CreativeScheduleAdjuster {
  describe(): string;
  adjust(item: CreativeSchedule, value: number): number;
}

export class PercentCreativeScheduleAdjuster implements CreativeScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleCreativeScheduleAdjuster implements CreativeScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CreativeSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumCreativeScheduleAdjuster implements CreativeScheduleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCreativeScheduleAdjuster implements CreativeScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCreativeScheduleAdjuster implements CreativeScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCreativeScheduleAdjuster implements CreativeScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the creative schedule steps in order and keeps a trace of each. */
export class CreativeScheduleEngine {
  steps: CreativeScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreativeSchedule): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: CreativeSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreativeScheduleEngine(): CreativeScheduleEngine {
  return new CreativeScheduleEngine(
    [
      new PercentCreativeScheduleAdjuster(21.1),
      new TitleCreativeScheduleAdjuster(
        new Map<string, number>([["south", 1.2], ["central", 1.39], ["east", 1.32]]),
      ),
      new MinimumCreativeScheduleAdjuster(41.9),
      new RoundingCreativeScheduleAdjuster(0.05),
      new CapCreativeScheduleAdjuster(25614),
      new TieredCreativeScheduleAdjuster([5239, 7887], [0.82, 1.11]),
    ],
    [],
    3.8,
    30472.2,
  );
}
