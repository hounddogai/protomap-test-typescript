import * as numbers from "../../../../kit/numbers.js";
import { PrimarySuppressionTier } from "./primary-suppression-tier.js";

/** One step of the primary suppression tier calculation. */
export interface PrimarySuppressionTierAdjuster {
  describe(): string;
  adjust(item: PrimarySuppressionTier, value: number): number;
}

export class PrimarySuppressionTierRevisionOffsetAdjuster implements PrimarySuppressionTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: PrimarySuppressionTier, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class PercentPrimarySuppressionTierAdjuster implements PrimarySuppressionTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimarySuppressionTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPrimarySuppressionTierAdjuster implements PrimarySuppressionTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimarySuppressionTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPrimarySuppressionTierAdjuster implements PrimarySuppressionTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySuppressionTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPrimarySuppressionTierAdjuster implements PrimarySuppressionTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimarySuppressionTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary suppression tier steps in order and keeps a trace of each. */
export class PrimarySuppressionTierEngine {
  steps: PrimarySuppressionTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySuppressionTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimarySuppressionTier): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PrimarySuppressionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimarySuppressionTierEngine(): PrimarySuppressionTierEngine {
  return new PrimarySuppressionTierEngine(
    [
      new PrimarySuppressionTierRevisionOffsetAdjuster(0.31),
      new PercentPrimarySuppressionTierAdjuster(9.7),
      new TieredPrimarySuppressionTierAdjuster([113, 794, 4183, 6035], [0.93, 0.96, 0.9, 1.15]),
      new CapPrimarySuppressionTierAdjuster(27637),
      new RoundingPrimarySuppressionTierAdjuster(5),
    ],
    [],
    2.7,
    56592.3,
  );
}
