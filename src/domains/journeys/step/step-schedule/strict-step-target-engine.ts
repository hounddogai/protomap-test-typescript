import * as numbers from "../../../../kit/numbers.js";
import { StrictStepTarget } from "./strict-step-target.js";

/** One step of the strict step target calculation. */
export interface StrictStepTargetModifier {
  describe(): string;
  adjust(item: StrictStepTarget, value: number): number;
}

export class SegmentStrictStepTargetAdjuster implements StrictStepTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: StrictStepTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictStepTargetAdjuster implements StrictStepTargetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictStepTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStrictStepTargetAdjuster implements StrictStepTargetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictStepTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictStepTargetAdjuster implements StrictStepTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictStepTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the strict step target steps in order and keeps a trace of each. */
export class StrictStepTargetEngine {
  steps: StrictStepTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictStepTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictStepTarget): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: StrictStepTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictStepTargetEngine(): StrictStepTargetEngine {
  return new StrictStepTargetEngine(
    [
      new SegmentStrictStepTargetAdjuster(new Map<string, number>([["online", 1.29]])),
      new TieredStrictStepTargetAdjuster([1077, 1329, 5854, 6587], [0.82, 0.98, 1.12, 0.92]),
      new CapStrictStepTargetAdjuster(16844),
      new RoundingStrictStepTargetAdjuster(5),
    ],
    [],
    3.2,
    29631.6,
  );
}
