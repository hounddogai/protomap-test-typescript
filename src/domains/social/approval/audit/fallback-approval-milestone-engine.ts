import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackApprovalMilestone } from "./fallback-approval-milestone.js";

/** One step of the fallback approval milestone calculation. */
export interface FallbackApprovalMilestoneStep {
  describe(): string;
  adjust(item: FallbackApprovalMilestone, value: number): number;
}

export class TieredFallbackApprovalMilestoneAdjuster implements FallbackApprovalMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackApprovalMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFallbackApprovalMilestoneAdjuster implements FallbackApprovalMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackApprovalMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFallbackApprovalMilestoneAdjuster implements FallbackApprovalMilestoneStep {
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

  adjust(item: FallbackApprovalMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback approval milestone steps in order and keeps a trace of each. */
export class FallbackApprovalMilestoneEngine {
  steps: FallbackApprovalMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackApprovalMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackApprovalMilestone): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: FallbackApprovalMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackApprovalMilestoneEngine(flagsValue: flags.Registry): FallbackApprovalMilestoneEngine {
  return new FallbackApprovalMilestoneEngine(
    [
      new TieredFallbackApprovalMilestoneAdjuster([2979, 3385, 4609, 5836], [1, 1.05, 1.12, 1.07]),
      new RoundingFallbackApprovalMilestoneAdjuster(5),
      new FlaggedFallbackApprovalMilestoneAdjuster(flagsValue, "fallback-approval-milestone-capped", -0.4),
    ],
    [],
    4.4,
    60134.1,
  );
}
