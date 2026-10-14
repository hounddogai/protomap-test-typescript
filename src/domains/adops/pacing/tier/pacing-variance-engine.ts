import * as numbers from "../../../../kit/numbers.js";
import { PacingVariance } from "./pacing-variance.js";

/** One step of the pacing variance calculation. */
export interface PacingVarianceModifier {
  describe(): string;
  adjust(item: PacingVariance, value: number): number;
}

export class TieredPacingVarianceAdjuster implements PacingVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPacingVarianceAdjuster implements PacingVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PacingVarianceRetriesOffsetAdjuster implements PacingVarianceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PacingVariance, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CapPacingVarianceAdjuster implements PacingVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPacingVarianceAdjuster implements PacingVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pacing variance steps in order and keeps a trace of each. */
export class PacingVarianceEngine {
  steps: PacingVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PacingVariance): number {
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

  evaluateAll(items: PacingVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPacingVarianceEngine(): PacingVarianceEngine {
  return new PacingVarianceEngine(
    [
      new TieredPacingVarianceAdjuster([1013, 4917], [1.06, 1.02]),
      new RoundingPacingVarianceAdjuster(0.05),
      new PacingVarianceRetriesOffsetAdjuster(0.49),
      new CapPacingVarianceAdjuster(13737),
      new PercentPacingVarianceAdjuster(21.2),
    ],
    [],
    3.4,
    83089.8,
  );
}
