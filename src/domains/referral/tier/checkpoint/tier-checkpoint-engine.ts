import * as numbers from "../../../../kit/numbers.js";
import { TierCheckpoint } from "./tier-checkpoint.js";

/** One step of the tier checkpoint calculation. */
export interface TierCheckpointModifier {
  describe(): string;
  adjust(item: TierCheckpoint, value: number): number;
}

export class RoundingTierCheckpointAdjuster implements TierCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTierCheckpointAdjuster implements TierCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourceTierCheckpointAdjuster implements TierCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: TierCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTierCheckpointAdjuster implements TierCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTierCheckpointAdjuster implements TierCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tier checkpoint steps in order and keeps a trace of each. */
export class TierCheckpointEngine {
  steps: TierCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TierCheckpoint): number {
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

  evaluateAll(items: TierCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTierCheckpointEngine(): TierCheckpointEngine {
  return new TierCheckpointEngine(
    [
      new RoundingTierCheckpointAdjuster(0.5),
      new MinimumTierCheckpointAdjuster(30.7),
      new SourceTierCheckpointAdjuster(new Map<string, number>([["online", 1.25], ["north", 1.26]])),
      new PercentTierCheckpointAdjuster(-0.1),
      new CapTierCheckpointAdjuster(24395),
    ],
    [],
    1.1,
    55207.1,
  );
}
