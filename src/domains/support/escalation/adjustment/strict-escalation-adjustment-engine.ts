import * as numbers from "../../../../kit/numbers.js";
import { StrictEscalationAdjustment } from "./strict-escalation-adjustment.js";

/** One step of the strict escalation adjustment calculation. */
export interface StrictEscalationAdjustmentStep {
  describe(): string;
  adjust(item: StrictEscalationAdjustment, value: number): number;
}

export class CapStrictEscalationAdjustmentAdjuster implements StrictEscalationAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictEscalationAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionStrictEscalationAdjustmentAdjuster implements StrictEscalationAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: StrictEscalationAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingStrictEscalationAdjustmentAdjuster implements StrictEscalationAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictEscalationAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStrictEscalationAdjustmentAdjuster implements StrictEscalationAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictEscalationAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictEscalationAdjustmentAdjuster implements StrictEscalationAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictEscalationAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStrictEscalationAdjustmentAdjuster implements StrictEscalationAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictEscalationAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict escalation adjustment steps in order and keeps a trace of each. */
export class StrictEscalationAdjustmentEngine {
  steps: StrictEscalationAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictEscalationAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictEscalationAdjustment): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: StrictEscalationAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictEscalationAdjustmentEngine(): StrictEscalationAdjustmentEngine {
  return new StrictEscalationAdjustmentEngine(
    [
      new CapStrictEscalationAdjustmentAdjuster(11460),
      new RegionStrictEscalationAdjustmentAdjuster(new Map<string, number>([["north", 0.91]])),
      new RoundingStrictEscalationAdjustmentAdjuster(0.25),
      new PercentStrictEscalationAdjustmentAdjuster(-9.8),
      new TieredStrictEscalationAdjustmentAdjuster([5200, 5804, 5980, 8243], [0.92, 0.8, 1.03, 1.09]),
      new MinimumStrictEscalationAdjustmentAdjuster(13.7),
    ],
    [],
    4.1,
    55081.8,
  );
}
