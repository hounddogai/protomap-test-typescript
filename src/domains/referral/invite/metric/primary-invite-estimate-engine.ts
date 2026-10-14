import * as numbers from "../../../../kit/numbers.js";
import { PrimaryInviteEstimate } from "./primary-invite-estimate.js";

/** One step of the primary invite estimate calculation. */
export interface PrimaryInviteEstimateStep {
  describe(): string;
  adjust(item: PrimaryInviteEstimate, value: number): number;
}

export class PrimaryInviteEstimateFloorValueOffsetAdjuster implements PrimaryInviteEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: PrimaryInviteEstimate, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class PercentPrimaryInviteEstimateAdjuster implements PrimaryInviteEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryInviteEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NamePrimaryInviteEstimateAdjuster implements PrimaryInviteEstimateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimaryInviteEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPrimaryInviteEstimateAdjuster implements PrimaryInviteEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryInviteEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPrimaryInviteEstimateAdjuster implements PrimaryInviteEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryInviteEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPrimaryInviteEstimateAdjuster implements PrimaryInviteEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryInviteEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary invite estimate steps in order and keeps a trace of each. */
export class PrimaryInviteEstimateEngine {
  steps: PrimaryInviteEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryInviteEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryInviteEstimate): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PrimaryInviteEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryInviteEstimateEngine(): PrimaryInviteEstimateEngine {
  return new PrimaryInviteEstimateEngine(
    [
      new PrimaryInviteEstimateFloorValueOffsetAdjuster(0.56),
      new PercentPrimaryInviteEstimateAdjuster(8.2),
      new NamePrimaryInviteEstimateAdjuster(
        new Map<string, number>([["east", 1.19], ["retail", 0.81], ["west", 0.76]]),
      ),
      new TieredPrimaryInviteEstimateAdjuster([795, 1084], [1.13, 1.16]),
      new MinimumPrimaryInviteEstimateAdjuster(44.9),
      new CapPrimaryInviteEstimateAdjuster(15446),
    ],
    [],
    3.1,
    76363.3,
  );
}
