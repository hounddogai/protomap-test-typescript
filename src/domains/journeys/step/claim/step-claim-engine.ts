import * as flags from "../../../../kit/flags.js";
import { StepClaim } from "./step-claim.js";

/** One step of the step claim calculation. */
export interface StepClaimAdjuster {
  describe(): string;
  adjust(item: StepClaim, value: number): number;
}

export class UtmSourceStepClaimAdjuster implements StepClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: StepClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapStepClaimAdjuster implements StepClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStepClaimAdjuster implements StepClaimAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: StepClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class StepClaimCapacityOffsetAdjuster implements StepClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: StepClaim, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class TieredStepClaimAdjuster implements StepClaimAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the step claim steps in order and keeps a trace of each. */
export class StepClaimEngine {
  steps: StepClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StepClaim): number {
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

  evaluateAll(items: StepClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStepClaimEngine(flagsValue: flags.Registry): StepClaimEngine {
  return new StepClaimEngine(
    [
      new UtmSourceStepClaimAdjuster(
        new Map<string, number>([["east", 1.15], ["retail", 1.06], ["online", 1.32]]),
      ),
      new CapStepClaimAdjuster(12456),
      new FlaggedStepClaimAdjuster(flagsValue, "step-claim-regional", 5.4),
      new StepClaimCapacityOffsetAdjuster(1.07),
      new TieredStepClaimAdjuster([1020, 2535, 7819, 9516], [0.83, 0.95, 1.07, 0.95]),
    ],
    [],
    3.2,
    3925,
  );
}
