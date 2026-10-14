import * as flags from "../../../../kit/flags.js";
import { AdaptiveBranchTarget } from "./adaptive-branch-target.js";

/** One step of the adaptive branch target calculation. */
export interface AdaptiveBranchTargetStep {
  describe(): string;
  adjust(item: AdaptiveBranchTarget, value: number): number;
}

export class FlaggedAdaptiveBranchTargetAdjuster implements AdaptiveBranchTargetStep {
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

  adjust(item: AdaptiveBranchTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitAdaptiveBranchTargetAdjuster implements AdaptiveBranchTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: AdaptiveBranchTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptiveBranchTargetOpenRateOffsetAdjuster implements AdaptiveBranchTargetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: AdaptiveBranchTarget, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class MinimumAdaptiveBranchTargetAdjuster implements AdaptiveBranchTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveBranchTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive branch target steps in order and keeps a trace of each. */
export class AdaptiveBranchTargetEngine {
  steps: AdaptiveBranchTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveBranchTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveBranchTarget): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: AdaptiveBranchTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveBranchTargetEngine(flagsValue: flags.Registry): AdaptiveBranchTargetEngine {
  return new AdaptiveBranchTargetEngine(
    [
      new FlaggedAdaptiveBranchTargetAdjuster(flagsValue, "adaptive-branch-target-rolling", 9.3),
      new UnitAdaptiveBranchTargetAdjuster(new Map<string, number>([["online", 1.06]])),
      new AdaptiveBranchTargetOpenRateOffsetAdjuster(1.16),
      new MinimumAdaptiveBranchTargetAdjuster(39.6),
    ],
    [],
    3.5,
    18141.2,
  );
}
