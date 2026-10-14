import * as numbers from "../../../../kit/numbers.js";
import { RegionalBadgeAssignment } from "./regional-badge-assignment.js";

/** One step of the regional badge assignment calculation. */
export interface RegionalBadgeAssignmentModifier {
  describe(): string;
  adjust(item: RegionalBadgeAssignment, value: number): number;
}

export class TitleRegionalBadgeAssignmentAdjuster implements RegionalBadgeAssignmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalBadgeAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRegionalBadgeAssignmentAdjuster implements RegionalBadgeAssignmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalBadgeAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRegionalBadgeAssignmentAdjuster implements RegionalBadgeAssignmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalBadgeAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRegionalBadgeAssignmentAdjuster implements RegionalBadgeAssignmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalBadgeAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRegionalBadgeAssignmentAdjuster implements RegionalBadgeAssignmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalBadgeAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionalBadgeAssignmentEndsAtOffsetAdjuster implements RegionalBadgeAssignmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: RegionalBadgeAssignment, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the regional badge assignment steps in order and keeps a trace of each. */
export class RegionalBadgeAssignmentEngine {
  steps: RegionalBadgeAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalBadgeAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalBadgeAssignment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RegionalBadgeAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalBadgeAssignmentEngine(): RegionalBadgeAssignmentEngine {
  return new RegionalBadgeAssignmentEngine(
    [
      new TitleRegionalBadgeAssignmentAdjuster(new Map<string, number>([["online", 0.93]])),
      new TieredRegionalBadgeAssignmentAdjuster([4556, 5960, 9883], [1.08, 0.81, 0.99]),
      new RoundingRegionalBadgeAssignmentAdjuster(0.25),
      new CapRegionalBadgeAssignmentAdjuster(33571),
      new PercentRegionalBadgeAssignmentAdjuster(5.6),
      new RegionalBadgeAssignmentEndsAtOffsetAdjuster(0.28),
    ],
    [],
    0.7,
    40972.5,
  );
}
