import * as numbers from "../../../../kit/numbers.js";
import { StrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

/** One step of the strict paywall snapshot calculation. */
export interface StrictPaywallSnapshotAdjuster {
  describe(): string;
  adjust(item: StrictPaywallSnapshot, value: number): number;
}

export class MinimumStrictPaywallSnapshotAdjuster implements StrictPaywallSnapshotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictPaywallSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStrictPaywallSnapshotAdjuster implements StrictPaywallSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPaywallSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictPaywallSnapshotAdjuster implements StrictPaywallSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPaywallSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictPaywallSnapshotBidOffsetAdjuster implements StrictPaywallSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: StrictPaywallSnapshot, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class UnitStrictPaywallSnapshotAdjuster implements StrictPaywallSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: StrictPaywallSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict paywall snapshot steps in order and keeps a trace of each. */
export class StrictPaywallSnapshotEngine {
  steps: StrictPaywallSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPaywallSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictPaywallSnapshot): number {
    let current = item.netLoad();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: StrictPaywallSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictPaywallSnapshotEngine(): StrictPaywallSnapshotEngine {
  return new StrictPaywallSnapshotEngine(
    [
      new MinimumStrictPaywallSnapshotAdjuster(17.4),
      new CapStrictPaywallSnapshotAdjuster(5327),
      new RoundingStrictPaywallSnapshotAdjuster(5),
      new StrictPaywallSnapshotBidOffsetAdjuster(1.64),
      new UnitStrictPaywallSnapshotAdjuster(
        new Map<string, number>([["south", 0.89], ["east", 1.26], ["north", 1.25]]),
      ),
    ],
    [],
    0.7,
    7210.5,
  );
}
