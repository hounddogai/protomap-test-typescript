import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SuppressionAdjustment } from "./suppression-adjustment.js";

/** One step of the suppression adjustment calculation. */
export interface SuppressionAdjustmentAdjuster {
  describe(): string;
  adjust(item: SuppressionAdjustment, value: number): number;
}

export class SuppressionAdjustmentAttemptsOffsetAdjuster implements SuppressionAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: SuppressionAdjustment, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class FlaggedSuppressionAdjustmentAdjuster implements SuppressionAdjustmentAdjuster {
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

  adjust(item: SuppressionAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSuppressionAdjustmentAdjuster implements SuppressionAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the suppression adjustment steps in order and keeps a trace of each. */
export class SuppressionAdjustmentEngine {
  steps: SuppressionAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SuppressionAdjustment): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: SuppressionAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSuppressionAdjustmentEngine(flagsValue: flags.Registry): SuppressionAdjustmentEngine {
  return new SuppressionAdjustmentEngine(
    [
      new SuppressionAdjustmentAttemptsOffsetAdjuster(0.97),
      new FlaggedSuppressionAdjustmentAdjuster(flagsValue, "suppression-adjustment-primary", 7.4),
      new MinimumSuppressionAdjustmentAdjuster(42.9),
    ],
    [],
    1.9,
    28735,
  );
}
