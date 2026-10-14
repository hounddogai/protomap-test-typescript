import * as numbers from "../../../../kit/numbers.js";
import { ScheduledStreakTemplate } from "./scheduled-streak-template.js";

/** One step of the scheduled streak template calculation. */
export interface ScheduledStreakTemplateAdjuster {
  describe(): string;
  adjust(item: ScheduledStreakTemplate, value: number): number;
}

export class SourceScheduledStreakTemplateAdjuster implements ScheduledStreakTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ScheduledStreakTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapScheduledStreakTemplateAdjuster implements ScheduledStreakTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledStreakTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledStreakTemplateAdjuster implements ScheduledStreakTemplateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledStreakTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled streak template steps in order and keeps a trace of each. */
export class ScheduledStreakTemplateEngine {
  steps: ScheduledStreakTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledStreakTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledStreakTemplate): number {
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

  evaluateAll(items: ScheduledStreakTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledStreakTemplateEngine(): ScheduledStreakTemplateEngine {
  return new ScheduledStreakTemplateEngine(
    [
      new SourceScheduledStreakTemplateAdjuster(new Map<string, number>([["south", 1.16], ["retail", 1.05]])),
      new CapScheduledStreakTemplateAdjuster(27430),
      new MinimumScheduledStreakTemplateAdjuster(5.3),
    ],
    [],
    4.8,
    25757.8,
  );
}
