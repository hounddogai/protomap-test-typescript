import * as flags from "../../../../kit/flags.js";
import { CappedMacroEstimate } from "./capped-macro-estimate.js";

/** One step of the capped macro estimate calculation. */
export interface CappedMacroEstimateStep {
  describe(): string;
  adjust(item: CappedMacroEstimate, value: number): number;
}

export class CapCappedMacroEstimateAdjuster implements CappedMacroEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedMacroEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedCappedMacroEstimateAdjuster implements CappedMacroEstimateStep {
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

  adjust(item: CappedMacroEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedMacroEstimateAdjuster implements CappedMacroEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedMacroEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped macro estimate steps in order and keeps a trace of each. */
export class CappedMacroEstimateEngine {
  steps: CappedMacroEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedMacroEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedMacroEstimate): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: CappedMacroEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedMacroEstimateEngine(flagsValue: flags.Registry): CappedMacroEstimateEngine {
  return new CappedMacroEstimateEngine(
    [
      new CapCappedMacroEstimateAdjuster(45268),
      new FlaggedCappedMacroEstimateAdjuster(flagsValue, "capped-macro-estimate-capped", -1.5),
      new TieredCappedMacroEstimateAdjuster([1286, 1946, 5876], [0.89, 0.97, 0.98]),
    ],
    [],
    4.8,
    91997.3,
  );
}
