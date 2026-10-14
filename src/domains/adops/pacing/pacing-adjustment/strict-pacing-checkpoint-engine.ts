import * as numbers from "../../../../kit/numbers.js";
import { StrictPacingCheckpoint } from "./strict-pacing-checkpoint.js";

/** One step of the strict pacing checkpoint calculation. */
export interface StrictPacingCheckpointAdjuster {
  describe(): string;
  adjust(item: StrictPacingCheckpoint, value: number): number;
}

export class TieredStrictPacingCheckpointAdjuster implements StrictPacingCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictPacingCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictPacingCheckpointAdjuster implements StrictPacingCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPacingCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitStrictPacingCheckpointAdjuster implements StrictPacingCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: StrictPacingCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictPacingCheckpointThresholdOffsetAdjuster implements StrictPacingCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: StrictPacingCheckpoint, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the strict pacing checkpoint steps in order and keeps a trace of each. */
export class StrictPacingCheckpointEngine {
  steps: StrictPacingCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPacingCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictPacingCheckpoint): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: StrictPacingCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictPacingCheckpointEngine(): StrictPacingCheckpointEngine {
  return new StrictPacingCheckpointEngine(
    [
      new TieredStrictPacingCheckpointAdjuster([2526, 3481, 6397, 8923], [1.1, 0.92, 0.86, 0.87]),
      new RoundingStrictPacingCheckpointAdjuster(0.25),
      new UnitStrictPacingCheckpointAdjuster(new Map<string, number>([["west", 0.73], ["central", 1.24]])),
      new StrictPacingCheckpointThresholdOffsetAdjuster(0.31),
    ],
    [],
    4.1,
    19402.4,
  );
}
