import * as flags from "../../../../kit/flags.js";
import { PendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

/** One step of the pending flight checkpoint calculation. */
export interface PendingFlightCheckpointModifier {
  describe(): string;
  adjust(item: PendingFlightCheckpoint, value: number): number;
}

export class CategoryPendingFlightCheckpointAdjuster implements PendingFlightCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PendingFlightCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPendingFlightCheckpointAdjuster implements PendingFlightCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingFlightCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPendingFlightCheckpointAdjuster implements PendingFlightCheckpointModifier {
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

  adjust(item: PendingFlightCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingFlightCheckpointAdjuster implements PendingFlightCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingFlightCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingFlightCheckpointAdjuster implements PendingFlightCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingFlightCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending flight checkpoint steps in order and keeps a trace of each. */
export class PendingFlightCheckpointEngine {
  steps: PendingFlightCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingFlightCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingFlightCheckpoint): number {
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

  evaluateAll(items: PendingFlightCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingFlightCheckpointEngine(flagsValue: flags.Registry): PendingFlightCheckpointEngine {
  return new PendingFlightCheckpointEngine(
    [
      new CategoryPendingFlightCheckpointAdjuster(
        new Map<string, number>([["south", 0.81], ["online", 0.86], ["east", 0.71]]),
      ),
      new MinimumPendingFlightCheckpointAdjuster(49.8),
      new FlaggedPendingFlightCheckpointAdjuster(flagsValue, "pending-flight-checkpoint-pending", 3.5),
      new CapPendingFlightCheckpointAdjuster(32469),
      new TieredPendingFlightCheckpointAdjuster([222, 7393], [1.18, 0.89]),
    ],
    [],
    5,
    65208.2,
  );
}
