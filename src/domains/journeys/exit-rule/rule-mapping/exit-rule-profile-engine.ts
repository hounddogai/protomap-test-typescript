import * as flags from "../../../../kit/flags.js";
import { ExitRuleProfile } from "./exit-rule-profile.js";

/** One step of the exit rule profile calculation. */
export interface ExitRuleProfileStep {
  describe(): string;
  adjust(item: ExitRuleProfile, value: number): number;
}

export class FlaggedExitRuleProfileAdjuster implements ExitRuleProfileStep {
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

  adjust(item: ExitRuleProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredExitRuleProfileAdjuster implements ExitRuleProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ExitRuleProfileRatioOffsetAdjuster implements ExitRuleProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: ExitRuleProfile, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class MinimumExitRuleProfileAdjuster implements ExitRuleProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapExitRuleProfileAdjuster implements ExitRuleProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the exit rule profile steps in order and keeps a trace of each. */
export class ExitRuleProfileEngine {
  steps: ExitRuleProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleProfile): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ExitRuleProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleProfileEngine(flagsValue: flags.Registry): ExitRuleProfileEngine {
  return new ExitRuleProfileEngine(
    [
      new FlaggedExitRuleProfileAdjuster(flagsValue, "exit-rule-profile-scheduled", 6),
      new TieredExitRuleProfileAdjuster([384, 2946, 3344, 5590], [1.01, 0.85, 0.88, 1.09]),
      new ExitRuleProfileRatioOffsetAdjuster(0.06),
      new MinimumExitRuleProfileAdjuster(27.4),
      new CapExitRuleProfileAdjuster(16442),
    ],
    [],
    2.2,
    86382,
  );
}
