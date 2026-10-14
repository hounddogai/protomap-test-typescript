import * as flags from "../../../../kit/flags.js";
import { LenientQueuePolicy } from "./lenient-queue-policy.js";

/** One step of the lenient queue policy calculation. */
export interface LenientQueuePolicyFactor {
  describe(): string;
  adjust(item: LenientQueuePolicy, value: number): number;
}

export class NameLenientQueuePolicyAdjuster implements LenientQueuePolicyFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientQueuePolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLenientQueuePolicyAdjuster implements LenientQueuePolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientQueuePolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLenientQueuePolicyAdjuster implements LenientQueuePolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientQueuePolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientQueuePolicyAdjuster implements LenientQueuePolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientQueuePolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LenientQueuePolicyEndsAtOffsetAdjuster implements LenientQueuePolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: LenientQueuePolicy, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class FlaggedLenientQueuePolicyAdjuster implements LenientQueuePolicyFactor {
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

  adjust(item: LenientQueuePolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient queue policy steps in order and keeps a trace of each. */
export class LenientQueuePolicyEngine {
  steps: LenientQueuePolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientQueuePolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientQueuePolicy): number {
    let current = item.weightedValue();
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

  evaluateAll(items: LenientQueuePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientQueuePolicyEngine(flagsValue: flags.Registry): LenientQueuePolicyEngine {
  return new LenientQueuePolicyEngine(
    [
      new NameLenientQueuePolicyAdjuster(
        new Map<string, number>([["south", 1.11], ["online", 1.23], ["east", 1.04]]),
      ),
      new MinimumLenientQueuePolicyAdjuster(40.4),
      new CapLenientQueuePolicyAdjuster(39609),
      new TieredLenientQueuePolicyAdjuster([727, 7614], [1.01, 1.02]),
      new LenientQueuePolicyEndsAtOffsetAdjuster(1.4),
      new FlaggedLenientQueuePolicyAdjuster(flagsValue, "lenient-queue-policy-regional", -4.2),
    ],
    [],
    0.4,
    80081.4,
  );
}
