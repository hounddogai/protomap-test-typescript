import * as numbers from "../../../../kit/numbers.js";
import { ManualNudgeOverride } from "./manual-nudge-override.js";

/** One step of the manual nudge override calculation. */
export interface ManualNudgeOverrideModifier {
  describe(): string;
  adjust(item: ManualNudgeOverride, value: number): number;
}

export class MinimumManualNudgeOverrideAdjuster implements ManualNudgeOverrideModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualNudgeOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualNudgeOverrideAdjuster implements ManualNudgeOverrideModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualNudgeOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingManualNudgeOverrideAdjuster implements ManualNudgeOverrideModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualNudgeOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual nudge override steps in order and keeps a trace of each. */
export class ManualNudgeOverrideEngine {
  steps: ManualNudgeOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualNudgeOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualNudgeOverride): number {
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

  evaluateAll(items: ManualNudgeOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualNudgeOverrideEngine(): ManualNudgeOverrideEngine {
  return new ManualNudgeOverrideEngine(
    [
      new MinimumManualNudgeOverrideAdjuster(37.8),
      new TieredManualNudgeOverrideAdjuster([2161, 4843, 5987, 8107], [0.95, 0.94, 1.16, 0.99]),
      new RoundingManualNudgeOverrideAdjuster(0.25),
    ],
    [],
    5,
    32760.3,
  );
}
