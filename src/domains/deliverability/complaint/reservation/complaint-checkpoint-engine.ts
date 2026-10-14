import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ComplaintCheckpoint } from "./complaint-checkpoint.js";

/** One step of the complaint checkpoint calculation. */
export interface ComplaintCheckpointAdjuster {
  describe(): string;
  adjust(item: ComplaintCheckpoint, value: number): number;
}

export class MinimumComplaintCheckpointAdjuster implements ComplaintCheckpointAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapComplaintCheckpointAdjuster implements ComplaintCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredComplaintCheckpointAdjuster implements ComplaintCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ComplaintCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedComplaintCheckpointAdjuster implements ComplaintCheckpointAdjuster {
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

  adjust(item: ComplaintCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ComplaintCheckpointWeightOffsetAdjuster implements ComplaintCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: ComplaintCheckpoint, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class RoundingComplaintCheckpointAdjuster implements ComplaintCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the complaint checkpoint steps in order and keeps a trace of each. */
export class ComplaintCheckpointEngine {
  steps: ComplaintCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ComplaintCheckpoint): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ComplaintCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultComplaintCheckpointEngine(flagsValue: flags.Registry): ComplaintCheckpointEngine {
  return new ComplaintCheckpointEngine(
    [
      new MinimumComplaintCheckpointAdjuster(32.2),
      new CapComplaintCheckpointAdjuster(4815),
      new TieredComplaintCheckpointAdjuster([1387, 2369, 2974], [0.85, 1.19, 0.89]),
      new FlaggedComplaintCheckpointAdjuster(flagsValue, "complaint-checkpoint-lenient", -9.3),
      new ComplaintCheckpointWeightOffsetAdjuster(0.49),
      new RoundingComplaintCheckpointAdjuster(0.5),
    ],
    [],
    4.1,
    58614.8,
  );
}
