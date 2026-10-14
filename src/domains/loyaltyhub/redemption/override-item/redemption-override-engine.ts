import * as numbers from "../../../../kit/numbers.js";
import { RedemptionOverride } from "./redemption-override.js";

/** One step of the redemption override calculation. */
export interface RedemptionOverrideStep {
  describe(): string;
  adjust(item: RedemptionOverride, value: number): number;
}

export class CapRedemptionOverrideAdjuster implements RedemptionOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RedemptionOverrideOpenRateOffsetAdjuster implements RedemptionOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: RedemptionOverride, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class RoundingRedemptionOverrideAdjuster implements RedemptionOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the redemption override steps in order and keeps a trace of each. */
export class RedemptionOverrideEngine {
  steps: RedemptionOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RedemptionOverride): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: RedemptionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRedemptionOverrideEngine(): RedemptionOverrideEngine {
  return new RedemptionOverrideEngine(
    [
      new CapRedemptionOverrideAdjuster(33378),
      new RedemptionOverrideOpenRateOffsetAdjuster(0.39),
      new RoundingRedemptionOverrideAdjuster(0.25),
    ],
    [],
    4.6,
    31811.9,
  );
}
