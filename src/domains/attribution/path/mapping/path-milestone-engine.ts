import * as numbers from "../../../../kit/numbers.js";
import { PathMilestone } from "./path-milestone.js";

/** One step of the path milestone calculation. */
export interface PathMilestoneModifier {
  describe(): string;
  adjust(item: PathMilestone, value: number): number;
}

export class PathMilestoneStartsAtOffsetAdjuster implements PathMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: PathMilestone, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class RoundingPathMilestoneAdjuster implements PathMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPathMilestoneAdjuster implements PathMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPathMilestoneAdjuster implements PathMilestoneModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPathMilestoneAdjuster implements PathMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelPathMilestoneAdjuster implements PathMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PathMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the path milestone steps in order and keeps a trace of each. */
export class PathMilestoneEngine {
  steps: PathMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PathMilestone): number {
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

  evaluateAll(items: PathMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPathMilestoneEngine(): PathMilestoneEngine {
  return new PathMilestoneEngine(
    [
      new PathMilestoneStartsAtOffsetAdjuster(1.61),
      new RoundingPathMilestoneAdjuster(0.5),
      new MinimumPathMilestoneAdjuster(36.4),
      new TieredPathMilestoneAdjuster([2662, 8505], [0.86, 1.11]),
      new PercentPathMilestoneAdjuster(5.3),
      new ChannelPathMilestoneAdjuster(
        new Map<string, number>([["retail", 0.78], ["central", 0.94], ["north", 0.75]]),
      ),
    ],
    [],
    0.6,
    62490.7,
  );
}
