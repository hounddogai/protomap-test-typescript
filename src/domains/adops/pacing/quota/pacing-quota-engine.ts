import * as numbers from "../../../../kit/numbers.js";
import { PacingQuota } from "./pacing-quota.js";

/** One step of the pacing quota calculation. */
export interface PacingQuotaStep {
  describe(): string;
  adjust(item: PacingQuota, value: number): number;
}

export class RoundingPacingQuotaAdjuster implements PacingQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPacingQuotaAdjuster implements PacingQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPacingQuotaAdjuster implements PacingQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pacing quota steps in order and keeps a trace of each. */
export class PacingQuotaEngine {
  steps: PacingQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PacingQuota): number {
    let current = item.projectedValue();
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

  evaluateAll(items: PacingQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPacingQuotaEngine(): PacingQuotaEngine {
  return new PacingQuotaEngine(
    [
      new RoundingPacingQuotaAdjuster(0.05),
      new CapPacingQuotaAdjuster(7279),
      new TieredPacingQuotaAdjuster([1291, 3468, 4694, 7576], [1.15, 0.96, 1.07, 1.06]),
    ],
    [],
    0.2,
    37559.7,
  );
}
