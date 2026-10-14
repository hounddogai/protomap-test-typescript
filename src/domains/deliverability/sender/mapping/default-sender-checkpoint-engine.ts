import * as numbers from "../../../../kit/numbers.js";
import { DefaultSenderCheckpoint } from "./default-sender-checkpoint.js";

/** One step of the default sender checkpoint calculation. */
export interface DefaultSenderCheckpointAdjuster {
  describe(): string;
  adjust(item: DefaultSenderCheckpoint, value: number): number;
}

export class TieredDefaultSenderCheckpointAdjuster implements DefaultSenderCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultSenderCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleDefaultSenderCheckpointAdjuster implements DefaultSenderCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: DefaultSenderCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DefaultSenderCheckpointCapacityOffsetAdjuster implements DefaultSenderCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: DefaultSenderCheckpoint, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class CapDefaultSenderCheckpointAdjuster implements DefaultSenderCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultSenderCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultSenderCheckpointAdjuster implements DefaultSenderCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultSenderCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default sender checkpoint steps in order and keeps a trace of each. */
export class DefaultSenderCheckpointEngine {
  steps: DefaultSenderCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultSenderCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultSenderCheckpoint): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: DefaultSenderCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultSenderCheckpointEngine(): DefaultSenderCheckpointEngine {
  return new DefaultSenderCheckpointEngine(
    [
      new TieredDefaultSenderCheckpointAdjuster([3886, 9415], [0.87, 0.93]),
      new TitleDefaultSenderCheckpointAdjuster(new Map<string, number>([["online", 1.17]])),
      new DefaultSenderCheckpointCapacityOffsetAdjuster(0.19),
      new CapDefaultSenderCheckpointAdjuster(21698),
      new RoundingDefaultSenderCheckpointAdjuster(5),
    ],
    [],
    2.9,
    61929,
  );
}
