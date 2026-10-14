import * as numbers from "../../../../kit/numbers.js";
import { FunnelProfile } from "./funnel-profile.js";

/** One step of the funnel profile calculation. */
export interface FunnelProfileAdjuster {
  describe(): string;
  adjust(item: FunnelProfile, value: number): number;
}

export class MinimumFunnelProfileAdjuster implements FunnelProfileAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FunnelProfileWindowDaysOffsetAdjuster implements FunnelProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: FunnelProfile, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class PercentFunnelProfileAdjuster implements FunnelProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleFunnelProfileAdjuster implements FunnelProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FunnelProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFunnelProfileAdjuster implements FunnelProfileAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the funnel profile steps in order and keeps a trace of each. */
export class FunnelProfileEngine {
  steps: FunnelProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelProfile): number {
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

  evaluateAll(items: FunnelProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelProfileEngine(): FunnelProfileEngine {
  return new FunnelProfileEngine(
    [
      new MinimumFunnelProfileAdjuster(23.9),
      new FunnelProfileWindowDaysOffsetAdjuster(0.56),
      new PercentFunnelProfileAdjuster(13.4),
      new TitleFunnelProfileAdjuster(new Map<string, number>([["online", 1.07], ["north", 1.39]])),
      new RoundingFunnelProfileAdjuster(1),
    ],
    [],
    4.7,
    97979.3,
  );
}
