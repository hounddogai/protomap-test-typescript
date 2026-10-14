import * as numbers from "../../../../kit/numbers.js";
import { RegionalRedemptionGroup } from "./regional-redemption-group.js";

/** One step of the regional redemption group calculation. */
export interface RegionalRedemptionGroupModifier {
  describe(): string;
  adjust(item: RegionalRedemptionGroup, value: number): number;
}

export class CapRegionalRedemptionGroupAdjuster implements RegionalRedemptionGroupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalRedemptionGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionalRedemptionGroupRateOffsetAdjuster implements RegionalRedemptionGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: RegionalRedemptionGroup, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class RoundingRegionalRedemptionGroupAdjuster implements RegionalRedemptionGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalRedemptionGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional redemption group steps in order and keeps a trace of each. */
export class RegionalRedemptionGroupEngine {
  steps: RegionalRedemptionGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalRedemptionGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalRedemptionGroup): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RegionalRedemptionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalRedemptionGroupEngine(): RegionalRedemptionGroupEngine {
  return new RegionalRedemptionGroupEngine(
    [
      new CapRegionalRedemptionGroupAdjuster(15450),
      new RegionalRedemptionGroupRateOffsetAdjuster(0.23),
      new RoundingRegionalRedemptionGroupAdjuster(0.5),
    ],
    [],
    3.2,
    91906.4,
  );
}
