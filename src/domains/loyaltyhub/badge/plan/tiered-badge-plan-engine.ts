import * as numbers from "../../../../kit/numbers.js";
import { TieredBadgePlan } from "./tiered-badge-plan.js";

/** One step of the tiered badge plan calculation. */
export interface TieredBadgePlanStep {
  describe(): string;
  adjust(item: TieredBadgePlan, value: number): number;
}

export class RoundingTieredBadgePlanAdjuster implements TieredBadgePlanStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBadgePlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBadgePlanAttemptsOffsetAdjuster implements TieredBadgePlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: TieredBadgePlan, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class CapTieredBadgePlanAdjuster implements TieredBadgePlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBadgePlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTieredBadgePlanAdjuster implements TieredBadgePlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredBadgePlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered badge plan steps in order and keeps a trace of each. */
export class TieredBadgePlanEngine {
  steps: TieredBadgePlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBadgePlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredBadgePlan): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: TieredBadgePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredBadgePlanEngine(): TieredBadgePlanEngine {
  return new TieredBadgePlanEngine(
    [
      new RoundingTieredBadgePlanAdjuster(0.5),
      new TieredBadgePlanAttemptsOffsetAdjuster(1.78),
      new CapTieredBadgePlanAdjuster(19756),
      new TieredTieredBadgePlanAdjuster([1290, 4856, 5492, 7251], [1.11, 0.97, 0.81, 0.93]),
    ],
    [],
    2,
    45185.4,
  );
}
