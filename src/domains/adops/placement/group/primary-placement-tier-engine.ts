import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPlacementTier } from "./primary-placement-tier.js";

/** One step of the primary placement tier calculation. */
export interface PrimaryPlacementTierStep {
  describe(): string;
  adjust(item: PrimaryPlacementTier, value: number): number;
}

export class PercentPrimaryPlacementTierAdjuster implements PrimaryPlacementTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPlacementTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryPlacementTierBatchSizeOffsetAdjuster implements PrimaryPlacementTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: PrimaryPlacementTier, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class RoundingPrimaryPlacementTierAdjuster implements PrimaryPlacementTierStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryPlacementTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryPlacementTierAdjuster implements PrimaryPlacementTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryPlacementTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary placement tier steps in order and keeps a trace of each. */
export class PrimaryPlacementTierEngine {
  steps: PrimaryPlacementTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPlacementTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryPlacementTier): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PrimaryPlacementTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryPlacementTierEngine(): PrimaryPlacementTierEngine {
  return new PrimaryPlacementTierEngine(
    [
      new PercentPrimaryPlacementTierAdjuster(-14.9),
      new PrimaryPlacementTierBatchSizeOffsetAdjuster(1.32),
      new RoundingPrimaryPlacementTierAdjuster(0.25),
      new CapPrimaryPlacementTierAdjuster(3464),
    ],
    [],
    2.1,
    21153.6,
  );
}
