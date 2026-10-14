import * as numbers from "../../../../kit/numbers.js";
import { JourneyEntry } from "./journey-entry.js";

/** One step of the journey entry calculation. */
export interface JourneyEntryModifier {
  describe(): string;
  adjust(item: JourneyEntry, value: number): number;
}

export class MinimumJourneyEntryAdjuster implements JourneyEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentJourneyEntryAdjuster implements JourneyEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: JourneyEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredJourneyEntryAdjuster implements JourneyEntryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class JourneyEntryQuantityOffsetAdjuster implements JourneyEntryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: JourneyEntry, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingJourneyEntryAdjuster implements JourneyEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentJourneyEntryAdjuster implements JourneyEntryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: JourneyEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the journey entry steps in order and keeps a trace of each. */
export class JourneyEntryEngine {
  steps: JourneyEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: JourneyEntry): number {
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

  evaluateAll(items: JourneyEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultJourneyEntryEngine(): JourneyEntryEngine {
  return new JourneyEntryEngine(
    [
      new MinimumJourneyEntryAdjuster(23.1),
      new SegmentJourneyEntryAdjuster(new Map<string, number>([["west", 0.93], ["retail", 1.27]])),
      new TieredJourneyEntryAdjuster([1421, 2794, 7627], [1.01, 1.07, 1.03]),
      new JourneyEntryQuantityOffsetAdjuster(1.82),
      new RoundingJourneyEntryAdjuster(0.5),
      new PercentJourneyEntryAdjuster(14.1),
    ],
    [],
    1.5,
    66430.1,
  );
}
