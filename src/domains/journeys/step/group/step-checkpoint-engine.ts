import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StepCheckpoint } from "./step-checkpoint.js";

/** One step of the step checkpoint calculation. */
export interface StepCheckpointFactor {
  describe(): string;
  adjust(item: StepCheckpoint, value: number): number;
}

export class RoundingStepCheckpointAdjuster implements StepCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStepCheckpointAdjuster implements StepCheckpointFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapStepCheckpointAdjuster implements StepCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStepCheckpointAdjuster implements StepCheckpointFactor {
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

  adjust(item: StepCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredStepCheckpointAdjuster implements StepCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the step checkpoint steps in order and keeps a trace of each. */
export class StepCheckpointEngine {
  steps: StepCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StepCheckpoint): number {
    let current = item.netValue();
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

  evaluateAll(items: StepCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStepCheckpointEngine(flagsValue: flags.Registry): StepCheckpointEngine {
  return new StepCheckpointEngine(
    [
      new RoundingStepCheckpointAdjuster(1),
      new MinimumStepCheckpointAdjuster(40.5),
      new CapStepCheckpointAdjuster(42350),
      new FlaggedStepCheckpointAdjuster(flagsValue, "step-checkpoint-global", 2.3),
      new TieredStepCheckpointAdjuster([3184, 4072], [1.17, 1.07]),
    ],
    [],
    1,
    7942.1,
  );
}
