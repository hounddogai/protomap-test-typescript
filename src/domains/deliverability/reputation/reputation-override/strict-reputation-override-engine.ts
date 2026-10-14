import * as flags from "../../../../kit/flags.js";
import { StrictReputationOverride } from "./strict-reputation-override.js";

/** One step of the strict reputation override calculation. */
export interface StrictReputationOverrideStep {
  describe(): string;
  adjust(item: StrictReputationOverride, value: number): number;
}

export class FlaggedStrictReputationOverrideAdjuster implements StrictReputationOverrideStep {
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

  adjust(item: StrictReputationOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictReputationOverrideAdjuster implements StrictReputationOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictReputationOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentStrictReputationOverrideAdjuster implements StrictReputationOverrideStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictReputationOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelStrictReputationOverrideAdjuster implements StrictReputationOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StrictReputationOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict reputation override steps in order and keeps a trace of each. */
export class StrictReputationOverrideEngine {
  steps: StrictReputationOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictReputationOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictReputationOverride): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: StrictReputationOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictReputationOverrideEngine(flagsValue: flags.Registry): StrictReputationOverrideEngine {
  return new StrictReputationOverrideEngine(
    [
      new FlaggedStrictReputationOverrideAdjuster(flagsValue, "strict-reputation-override-adaptive", -4.3),
      new MinimumStrictReputationOverrideAdjuster(43.4),
      new PercentStrictReputationOverrideAdjuster(-7.1),
      new LabelStrictReputationOverrideAdjuster(new Map<string, number>([["east", 1.15], ["north", 1.26]])),
    ],
    [],
    2.8,
    10468,
  );
}
