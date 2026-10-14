import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { JourneySnapshot } from "./journey-snapshot.js";

/** One step of the journey snapshot calculation. */
export interface JourneySnapshotStep {
  describe(): string;
  adjust(item: JourneySnapshot, value: number): number;
}

export class FlaggedJourneySnapshotAdjuster implements JourneySnapshotStep {
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

  adjust(item: JourneySnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class JourneySnapshotSendAtOffsetAdjuster implements JourneySnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: JourneySnapshot, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class CapJourneySnapshotAdjuster implements JourneySnapshotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneySnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredJourneySnapshotAdjuster implements JourneySnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneySnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingJourneySnapshotAdjuster implements JourneySnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneySnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumJourneySnapshotAdjuster implements JourneySnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneySnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the journey snapshot steps in order and keeps a trace of each. */
export class JourneySnapshotEngine {
  steps: JourneySnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneySnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: JourneySnapshot): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: JourneySnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultJourneySnapshotEngine(flagsValue: flags.Registry): JourneySnapshotEngine {
  return new JourneySnapshotEngine(
    [
      new FlaggedJourneySnapshotAdjuster(flagsValue, "journey-snapshot-regional", 5.8),
      new JourneySnapshotSendAtOffsetAdjuster(0.12),
      new CapJourneySnapshotAdjuster(8368),
      new TieredJourneySnapshotAdjuster([1622, 5604, 6388, 6469], [0.82, 1.06, 1.2, 1.09]),
      new RoundingJourneySnapshotAdjuster(0.25),
      new MinimumJourneySnapshotAdjuster(37),
    ],
    [],
    2.4,
    53058.1,
  );
}
