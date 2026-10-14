import { DefaultWarmupAssignment } from "./default-warmup-assignment.js";

/** One step of the default warmup assignment calculation. */
export interface DefaultWarmupAssignmentFactor {
  describe(): string;
  adjust(item: DefaultWarmupAssignment, value: number): number;
}

export class TieredDefaultWarmupAssignmentAdjuster implements DefaultWarmupAssignmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultWarmupAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultWarmupAssignmentAdjuster implements DefaultWarmupAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultWarmupAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DefaultWarmupAssignmentOpenRateOffsetAdjuster implements DefaultWarmupAssignmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: DefaultWarmupAssignment, value: number): number {
    return value + item.openRate * this.weight;
  }
}

/** Runs the default warmup assignment steps in order and keeps a trace of each. */
export class DefaultWarmupAssignmentEngine {
  steps: DefaultWarmupAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultWarmupAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultWarmupAssignment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DefaultWarmupAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultWarmupAssignmentEngine(): DefaultWarmupAssignmentEngine {
  return new DefaultWarmupAssignmentEngine(
    [
      new TieredDefaultWarmupAssignmentAdjuster([2586, 8658], [0.89, 0.82]),
      new MinimumDefaultWarmupAssignmentAdjuster(19.3),
      new DefaultWarmupAssignmentOpenRateOffsetAdjuster(1.3),
    ],
    [],
    3.8,
    52103.9,
  );
}
