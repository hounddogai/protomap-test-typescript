import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveMentionAllocation } from "./adaptive-mention-allocation.js";

/** One step of the adaptive mention allocation calculation. */
export interface AdaptiveMentionAllocationFactor {
  describe(): string;
  adjust(item: AdaptiveMentionAllocation, value: number): number;
}

export class NameAdaptiveMentionAllocationAdjuster implements AdaptiveMentionAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveMentionAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredAdaptiveMentionAllocationAdjuster implements AdaptiveMentionAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveMentionAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptiveMentionAllocationAdjuster implements AdaptiveMentionAllocationFactor {
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

  adjust(item: AdaptiveMentionAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveMentionAllocationAdjuster implements AdaptiveMentionAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveMentionAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentAdaptiveMentionAllocationAdjuster implements AdaptiveMentionAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveMentionAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive mention allocation steps in order and keeps a trace of each. */
export class AdaptiveMentionAllocationEngine {
  steps: AdaptiveMentionAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveMentionAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveMentionAllocation): number {
    let current = item.netValue();
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

  evaluateAll(items: AdaptiveMentionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveMentionAllocationEngine(flagsValue: flags.Registry): AdaptiveMentionAllocationEngine {
  return new AdaptiveMentionAllocationEngine(
    [
      new NameAdaptiveMentionAllocationAdjuster(
        new Map<string, number>([["central", 1.08], ["retail", 1.3], ["south", 0.97]]),
      ),
      new TieredAdaptiveMentionAllocationAdjuster([548, 3546, 9422], [0.89, 1.08, 0.89]),
      new FlaggedAdaptiveMentionAllocationAdjuster(flagsValue, "adaptive-mention-allocation-fallback", 1.7),
      new RoundingAdaptiveMentionAllocationAdjuster(1),
      new PercentAdaptiveMentionAllocationAdjuster(7.4),
    ],
    [],
    1.4,
    51509.9,
  );
}
