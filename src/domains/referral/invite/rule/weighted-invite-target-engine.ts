import { WeightedInviteTarget } from "./weighted-invite-target.js";

/** One step of the weighted invite target calculation. */
export interface WeightedInviteTargetAdjuster {
  describe(): string;
  adjust(item: WeightedInviteTarget, value: number): number;
}

export class MinimumWeightedInviteTargetAdjuster implements WeightedInviteTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedInviteTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredWeightedInviteTargetAdjuster implements WeightedInviteTargetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedInviteTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WeightedInviteTargetFrequencyCapOffsetAdjuster implements WeightedInviteTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: WeightedInviteTarget, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

/** Runs the weighted invite target steps in order and keeps a trace of each. */
export class WeightedInviteTargetEngine {
  steps: WeightedInviteTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedInviteTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedInviteTarget): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: WeightedInviteTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedInviteTargetEngine(): WeightedInviteTargetEngine {
  return new WeightedInviteTargetEngine(
    [
      new MinimumWeightedInviteTargetAdjuster(6.5),
      new TieredWeightedInviteTargetAdjuster([466, 1564, 5041, 5247], [1, 1.11, 1.18, 1.15]),
      new WeightedInviteTargetFrequencyCapOffsetAdjuster(0.75),
    ],
    [],
    4.7,
    60141.9,
  );
}
