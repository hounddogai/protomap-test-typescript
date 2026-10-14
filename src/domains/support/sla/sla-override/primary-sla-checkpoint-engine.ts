import * as numbers from "../../../../kit/numbers.js";
import { PrimarySlaCheckpoint } from "./primary-sla-checkpoint.js";

/** One step of the primary sla checkpoint calculation. */
export interface PrimarySlaCheckpointFactor {
  describe(): string;
  adjust(item: PrimarySlaCheckpoint, value: number): number;
}

export class RoundingPrimarySlaCheckpointAdjuster implements PrimarySlaCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimarySlaCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimarySlaCheckpointAdjuster implements PrimarySlaCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimarySlaCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitlePrimarySlaCheckpointAdjuster implements PrimarySlaCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PrimarySlaCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPrimarySlaCheckpointAdjuster implements PrimarySlaCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimarySlaCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary sla checkpoint steps in order and keeps a trace of each. */
export class PrimarySlaCheckpointEngine {
  steps: PrimarySlaCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySlaCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimarySlaCheckpoint): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PrimarySlaCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimarySlaCheckpointEngine(): PrimarySlaCheckpointEngine {
  return new PrimarySlaCheckpointEngine(
    [
      new RoundingPrimarySlaCheckpointAdjuster(0.1),
      new CapPrimarySlaCheckpointAdjuster(48639),
      new TitlePrimarySlaCheckpointAdjuster(
        new Map<string, number>([["online", 0.73], ["east", 0.98], ["central", 1.23]]),
      ),
      new MinimumPrimarySlaCheckpointAdjuster(15.7),
    ],
    [],
    2.9,
    97457.7,
  );
}
