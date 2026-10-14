import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedPacingPolicy } from "./batched-pacing-policy.js";

/** One step of the batched pacing policy calculation. */
export interface BatchedPacingPolicyStep {
  describe(): string;
  adjust(item: BatchedPacingPolicy, value: number): number;
}

export class MinimumBatchedPacingPolicyAdjuster implements BatchedPacingPolicyStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPacingPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedPacingPolicyAdjuster implements BatchedPacingPolicyStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPacingPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBatchedPacingPolicyAdjuster implements BatchedPacingPolicyStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPacingPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedPacingPolicyAdjuster implements BatchedPacingPolicyStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedPacingPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedPacingPolicyAdjuster implements BatchedPacingPolicyStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedPacingPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBatchedPacingPolicyAdjuster implements BatchedPacingPolicyStep {
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

  adjust(item: BatchedPacingPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched pacing policy steps in order and keeps a trace of each. */
export class BatchedPacingPolicyEngine {
  steps: BatchedPacingPolicyStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPacingPolicyStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedPacingPolicy): number {
    let current = item.netExposure();
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

  evaluateAll(items: BatchedPacingPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedPacingPolicyEngine(flagsValue: flags.Registry): BatchedPacingPolicyEngine {
  return new BatchedPacingPolicyEngine(
    [
      new MinimumBatchedPacingPolicyAdjuster(43.5),
      new TieredBatchedPacingPolicyAdjuster([1023, 2486, 2614, 4998], [0.94, 1.13, 1.16, 1.17]),
      new CapBatchedPacingPolicyAdjuster(4184),
      new PercentBatchedPacingPolicyAdjuster(19.2),
      new RoundingBatchedPacingPolicyAdjuster(0.1),
      new FlaggedBatchedPacingPolicyAdjuster(flagsValue, "batched-pacing-policy-primary", -4.9),
    ],
    [],
    1.3,
    94690.2,
  );
}
