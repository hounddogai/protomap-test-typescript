import { PendingReputationCheckpoint } from "./pending-reputation-checkpoint.js";

/** One step of the pending reputation checkpoint calculation. */
export interface PendingReputationCheckpointStep {
  describe(): string;
  adjust(item: PendingReputationCheckpoint, value: number): number;
}

export class UtmSourcePendingReputationCheckpointAdjuster implements PendingReputationCheckpointStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: PendingReputationCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingReputationCheckpointAdjuster implements PendingReputationCheckpointStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingReputationCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingReputationCheckpointImpressionsOffsetAdjuster implements PendingReputationCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: PendingReputationCheckpoint, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class CapPendingReputationCheckpointAdjuster implements PendingReputationCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingReputationCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPendingReputationCheckpointAdjuster implements PendingReputationCheckpointStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingReputationCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPendingReputationCheckpointAdjuster implements PendingReputationCheckpointStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingReputationCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending reputation checkpoint steps in order and keeps a trace of each. */
export class PendingReputationCheckpointEngine {
  steps: PendingReputationCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingReputationCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingReputationCheckpoint): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PendingReputationCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingReputationCheckpointEngine(): PendingReputationCheckpointEngine {
  return new PendingReputationCheckpointEngine(
    [
      new UtmSourcePendingReputationCheckpointAdjuster(
        new Map<string, number>([["west", 1.05], ["online", 1.34]]),
      ),
      new PercentPendingReputationCheckpointAdjuster(7.9),
      new PendingReputationCheckpointImpressionsOffsetAdjuster(0.88),
      new CapPendingReputationCheckpointAdjuster(4528),
      new MinimumPendingReputationCheckpointAdjuster(45),
      new TieredPendingReputationCheckpointAdjuster([1006, 2940, 8289], [0.95, 0.83, 0.85]),
    ],
    [],
    1.5,
    91286.1,
  );
}
