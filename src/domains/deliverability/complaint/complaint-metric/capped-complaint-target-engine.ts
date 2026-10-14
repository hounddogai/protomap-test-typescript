import * as flags from "../../../../kit/flags.js";
import { CappedComplaintTarget } from "./capped-complaint-target.js";

/** One step of the capped complaint target calculation. */
export interface CappedComplaintTargetModifier {
  describe(): string;
  adjust(item: CappedComplaintTarget, value: number): number;
}

export class CappedComplaintTargetEndsAtOffsetAdjuster implements CappedComplaintTargetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: CappedComplaintTarget, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class TieredCappedComplaintTargetAdjuster implements CappedComplaintTargetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedComplaintTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCappedComplaintTargetAdjuster implements CappedComplaintTargetModifier {
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

  adjust(item: CappedComplaintTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped complaint target steps in order and keeps a trace of each. */
export class CappedComplaintTargetEngine {
  steps: CappedComplaintTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedComplaintTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedComplaintTarget): number {
    let current = item.projectedValue();
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

  evaluateAll(items: CappedComplaintTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedComplaintTargetEngine(flagsValue: flags.Registry): CappedComplaintTargetEngine {
  return new CappedComplaintTargetEngine(
    [
      new CappedComplaintTargetEndsAtOffsetAdjuster(0.15),
      new TieredCappedComplaintTargetAdjuster([4100, 4367, 5088, 7268], [1.01, 1.07, 1.1, 1.05]),
      new FlaggedCappedComplaintTargetAdjuster(flagsValue, "capped-complaint-target-strict", 8.4),
    ],
    [],
    0.9,
    40181,
  );
}
