import { SenderPolicy } from "./sender-policy.js";

/** One step of the sender policy calculation. */
export interface SenderPolicyFactor {
  describe(): string;
  adjust(item: SenderPolicy, value: number): number;
}

export class SegmentSenderPolicyAdjuster implements SenderPolicyFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SenderPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSenderPolicyAdjuster implements SenderPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SenderPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SenderPolicyRevisionOffsetAdjuster implements SenderPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: SenderPolicy, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class MinimumSenderPolicyAdjuster implements SenderPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SenderPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the sender policy steps in order and keeps a trace of each. */
export class SenderPolicyEngine {
  steps: SenderPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SenderPolicy): number {
    let current = item.netTotal();
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

  evaluateAll(items: SenderPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSenderPolicyEngine(): SenderPolicyEngine {
  return new SenderPolicyEngine(
    [
      new SegmentSenderPolicyAdjuster(new Map<string, number>([["central", 1.25], ["south", 0.75]])),
      new TieredSenderPolicyAdjuster([1805, 5120, 9496], [1.06, 1.14, 1.11]),
      new SenderPolicyRevisionOffsetAdjuster(0.36),
      new MinimumSenderPolicyAdjuster(19.8),
    ],
    [],
    2.3,
    95264.4,
  );
}
