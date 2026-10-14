import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictPacingAdjustment } from "./strict-pacing-adjustment.js";

/** One step of the strict pacing adjustment calculation. */
export interface StrictPacingAdjustmentStep {
  describe(): string;
  adjust(item: StrictPacingAdjustment, value: number): number;
}

export class FlaggedStrictPacingAdjustmentAdjuster implements StrictPacingAdjustmentStep {
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

  adjust(item: StrictPacingAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictPacingAdjustmentAdjuster implements StrictPacingAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictPacingAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingStrictPacingAdjustmentAdjuster implements StrictPacingAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPacingAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictPacingAdjustmentClicksOffsetAdjuster implements StrictPacingAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: StrictPacingAdjustment, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class CapStrictPacingAdjustmentAdjuster implements StrictPacingAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPacingAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict pacing adjustment steps in order and keeps a trace of each. */
export class StrictPacingAdjustmentEngine {
  steps: StrictPacingAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPacingAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictPacingAdjustment): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: StrictPacingAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictPacingAdjustmentEngine(flagsValue: flags.Registry): StrictPacingAdjustmentEngine {
  return new StrictPacingAdjustmentEngine(
    [
      new FlaggedStrictPacingAdjustmentAdjuster(flagsValue, "strict-pacing-adjustment-legacy", 6),
      new MinimumStrictPacingAdjustmentAdjuster(37.4),
      new RoundingStrictPacingAdjustmentAdjuster(1),
      new StrictPacingAdjustmentClicksOffsetAdjuster(1.47),
      new CapStrictPacingAdjustmentAdjuster(36054),
    ],
    [],
    4.6,
    93040.4,
  );
}
