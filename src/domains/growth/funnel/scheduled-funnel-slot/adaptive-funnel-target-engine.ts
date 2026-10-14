import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveFunnelTarget } from "./adaptive-funnel-target.js";

/** One step of the adaptive funnel target calculation. */
export interface AdaptiveFunnelTargetFactor {
  describe(): string;
  adjust(item: AdaptiveFunnelTarget, value: number): number;
}

export class AdaptiveFunnelTargetMaximumOffsetAdjuster implements AdaptiveFunnelTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: AdaptiveFunnelTarget, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class CapAdaptiveFunnelTargetAdjuster implements AdaptiveFunnelTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveFunnelTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveFunnelTargetAdjuster implements AdaptiveFunnelTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveFunnelTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingAdaptiveFunnelTargetAdjuster implements AdaptiveFunnelTargetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveFunnelTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryAdaptiveFunnelTargetAdjuster implements AdaptiveFunnelTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: AdaptiveFunnelTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive funnel target steps in order and keeps a trace of each. */
export class AdaptiveFunnelTargetEngine {
  steps: AdaptiveFunnelTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveFunnelTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveFunnelTarget): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: AdaptiveFunnelTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveFunnelTargetEngine(): AdaptiveFunnelTargetEngine {
  return new AdaptiveFunnelTargetEngine(
    [
      new AdaptiveFunnelTargetMaximumOffsetAdjuster(0.37),
      new CapAdaptiveFunnelTargetAdjuster(7329),
      new MinimumAdaptiveFunnelTargetAdjuster(31.2),
      new RoundingAdaptiveFunnelTargetAdjuster(5),
      new CategoryAdaptiveFunnelTargetAdjuster(
        new Map<string, number>([["retail", 1.38], ["east", 1.07], ["north", 0.78]]),
      ),
    ],
    [],
    2.1,
    47261.6,
  );
}
