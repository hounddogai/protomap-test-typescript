import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFrequencyClaim } from "./scheduled-frequency-claim.js";

/** One step of the scheduled frequency claim calculation. */
export interface ScheduledFrequencyClaimAdjuster {
  describe(): string;
  adjust(item: ScheduledFrequencyClaim, value: number): number;
}

export class CapScheduledFrequencyClaimAdjuster implements ScheduledFrequencyClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledFrequencyClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingScheduledFrequencyClaimAdjuster implements ScheduledFrequencyClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledFrequencyClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledFrequencyClaimAdjuster implements ScheduledFrequencyClaimAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledFrequencyClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleScheduledFrequencyClaimAdjuster implements ScheduledFrequencyClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ScheduledFrequencyClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ScheduledFrequencyClaimCeilingOffsetAdjuster implements ScheduledFrequencyClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ScheduledFrequencyClaim, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class MinimumScheduledFrequencyClaimAdjuster implements ScheduledFrequencyClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledFrequencyClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled frequency claim steps in order and keeps a trace of each. */
export class ScheduledFrequencyClaimEngine {
  steps: ScheduledFrequencyClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFrequencyClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledFrequencyClaim): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ScheduledFrequencyClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledFrequencyClaimEngine(): ScheduledFrequencyClaimEngine {
  return new ScheduledFrequencyClaimEngine(
    [
      new CapScheduledFrequencyClaimAdjuster(6682),
      new RoundingScheduledFrequencyClaimAdjuster(0.25),
      new TieredScheduledFrequencyClaimAdjuster([2218, 7700, 8348, 9372], [0.86, 1.02, 0.96, 1.06]),
      new LocaleScheduledFrequencyClaimAdjuster(
        new Map<string, number>([["central", 1.11], ["online", 1.19], ["south", 0.84]]),
      ),
      new ScheduledFrequencyClaimCeilingOffsetAdjuster(1.34),
      new MinimumScheduledFrequencyClaimAdjuster(43.8),
    ],
    [],
    0.1,
    97592.8,
  );
}
