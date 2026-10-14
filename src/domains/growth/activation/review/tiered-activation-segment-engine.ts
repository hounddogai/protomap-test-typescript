import * as numbers from "../../../../kit/numbers.js";
import { TieredActivationSegment } from "./tiered-activation-segment.js";

/** One step of the tiered activation segment calculation. */
export interface TieredActivationSegmentModifier {
  describe(): string;
  adjust(item: TieredActivationSegment, value: number): number;
}

export class TieredActivationSegmentExpiresAtOffsetAdjuster implements TieredActivationSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: TieredActivationSegment, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class RoundingTieredActivationSegmentAdjuster implements TieredActivationSegmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredActivationSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTieredActivationSegmentAdjuster implements TieredActivationSegmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredActivationSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredActivationSegmentAdjuster implements TieredActivationSegmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredActivationSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelTieredActivationSegmentAdjuster implements TieredActivationSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredActivationSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered activation segment steps in order and keeps a trace of each. */
export class TieredActivationSegmentEngine {
  steps: TieredActivationSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredActivationSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredActivationSegment): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: TieredActivationSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredActivationSegmentEngine(): TieredActivationSegmentEngine {
  return new TieredActivationSegmentEngine(
    [
      new TieredActivationSegmentExpiresAtOffsetAdjuster(0.75),
      new RoundingTieredActivationSegmentAdjuster(0.25),
      new CapTieredActivationSegmentAdjuster(20687),
      new MinimumTieredActivationSegmentAdjuster(3.5),
      new LabelTieredActivationSegmentAdjuster(new Map<string, number>([["central", 1.36]])),
    ],
    [],
    3,
    74392.6,
  );
}
