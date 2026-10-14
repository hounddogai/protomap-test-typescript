import * as flags from "../../../../kit/flags.js";
import { ChallengeAllocation } from "./challenge-allocation.js";

/** One step of the challenge allocation calculation. */
export interface ChallengeAllocationAdjuster {
  describe(): string;
  adjust(item: ChallengeAllocation, value: number): number;
}

export class TieredChallengeAllocationAdjuster implements ChallengeAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedChallengeAllocationAdjuster implements ChallengeAllocationAdjuster {
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

  adjust(item: ChallengeAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentChallengeAllocationAdjuster implements ChallengeAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ChallengeAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the challenge allocation steps in order and keeps a trace of each. */
export class ChallengeAllocationEngine {
  steps: ChallengeAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ChallengeAllocation): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ChallengeAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultChallengeAllocationEngine(flagsValue: flags.Registry): ChallengeAllocationEngine {
  return new ChallengeAllocationEngine(
    [
      new TieredChallengeAllocationAdjuster([3711, 8428], [0.82, 1.08]),
      new FlaggedChallengeAllocationAdjuster(flagsValue, "challenge-allocation-legacy", 5),
      new SegmentChallengeAllocationAdjuster(
        new Map<string, number>([["online", 1.37], ["central", 1.05], ["retail", 1.32]]),
      ),
    ],
    [],
    4.7,
    51991.2,
  );
}
