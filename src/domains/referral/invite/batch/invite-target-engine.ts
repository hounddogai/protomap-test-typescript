import * as numbers from "../../../../kit/numbers.js";
import { InviteTarget } from "./invite-target.js";

/** One step of the invite target calculation. */
export interface InviteTargetStep {
  describe(): string;
  adjust(item: InviteTarget, value: number): number;
}

export class InviteTargetDiscountOffsetAdjuster implements InviteTargetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: InviteTarget, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class UtmSourceInviteTargetAdjuster implements InviteTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: InviteTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingInviteTargetAdjuster implements InviteTargetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumInviteTargetAdjuster implements InviteTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapInviteTargetAdjuster implements InviteTargetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the invite target steps in order and keeps a trace of each. */
export class InviteTargetEngine {
  steps: InviteTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InviteTarget): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: InviteTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInviteTargetEngine(): InviteTargetEngine {
  return new InviteTargetEngine(
    [
      new InviteTargetDiscountOffsetAdjuster(0.74),
      new UtmSourceInviteTargetAdjuster(new Map<string, number>([["north", 1.08]])),
      new RoundingInviteTargetAdjuster(0.05),
      new MinimumInviteTargetAdjuster(43.4),
      new CapInviteTargetAdjuster(5136),
    ],
    [],
    1.2,
    28026.3,
  );
}
