import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalFraudCheckCheckpoint } from "./regional-fraud-check-checkpoint.js";

/** One step of the regional fraud check checkpoint calculation. */
export interface RegionalFraudCheckCheckpointAdjuster {
  describe(): string;
  adjust(item: RegionalFraudCheckCheckpoint, value: number): number;
}

export class MinimumRegionalFraudCheckCheckpointAdjuster implements RegionalFraudCheckCheckpointAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalFraudCheckCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalFraudCheckCheckpointAdjuster implements RegionalFraudCheckCheckpointAdjuster {
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

  adjust(item: RegionalFraudCheckCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalFraudCheckCheckpointAdjuster implements RegionalFraudCheckCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalFraudCheckCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionalFraudCheckCheckpointCeilingOffsetAdjuster implements RegionalFraudCheckCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: RegionalFraudCheckCheckpoint, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class CapRegionalFraudCheckCheckpointAdjuster implements RegionalFraudCheckCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalFraudCheckCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelRegionalFraudCheckCheckpointAdjuster implements RegionalFraudCheckCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalFraudCheckCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional fraud check checkpoint steps in order and keeps a trace of each. */
export class RegionalFraudCheckCheckpointEngine {
  steps: RegionalFraudCheckCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalFraudCheckCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalFraudCheckCheckpoint): number {
    let current = item.netValue();
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

  evaluateAll(items: RegionalFraudCheckCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalFraudCheckCheckpointEngine(flagsValue: flags.Registry): RegionalFraudCheckCheckpointEngine {
  return new RegionalFraudCheckCheckpointEngine(
    [
      new MinimumRegionalFraudCheckCheckpointAdjuster(17.6),
      new FlaggedRegionalFraudCheckCheckpointAdjuster(
        flagsValue,
        "regional-fraud-check-checkpoint-legacy",
        -1.9,
      ),
      new RoundingRegionalFraudCheckCheckpointAdjuster(0.1),
      new RegionalFraudCheckCheckpointCeilingOffsetAdjuster(1.71),
      new CapRegionalFraudCheckCheckpointAdjuster(25845),
      new LabelRegionalFraudCheckCheckpointAdjuster(
        new Map<string, number>([["north", 1.35], ["central", 0.79], ["retail", 0.74]]),
      ),
    ],
    [],
    0.4,
    70937.9,
  );
}
