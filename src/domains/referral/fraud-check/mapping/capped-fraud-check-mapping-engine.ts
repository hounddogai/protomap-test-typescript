import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedFraudCheckMapping } from "./capped-fraud-check-mapping.js";

/** One step of the capped fraud check mapping calculation. */
export interface CappedFraudCheckMappingFactor {
  describe(): string;
  adjust(item: CappedFraudCheckMapping, value: number): number;
}

export class CappedFraudCheckMappingThresholdOffsetAdjuster implements CappedFraudCheckMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: CappedFraudCheckMapping, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class TitleCappedFraudCheckMappingAdjuster implements CappedFraudCheckMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CappedFraudCheckMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedCappedFraudCheckMappingAdjuster implements CappedFraudCheckMappingFactor {
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

  adjust(item: CappedFraudCheckMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedFraudCheckMappingAdjuster implements CappedFraudCheckMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedFraudCheckMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped fraud check mapping steps in order and keeps a trace of each. */
export class CappedFraudCheckMappingEngine {
  steps: CappedFraudCheckMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedFraudCheckMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedFraudCheckMapping): number {
    let current = item.netLoad();
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

  evaluateAll(items: CappedFraudCheckMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedFraudCheckMappingEngine(flagsValue: flags.Registry): CappedFraudCheckMappingEngine {
  return new CappedFraudCheckMappingEngine(
    [
      new CappedFraudCheckMappingThresholdOffsetAdjuster(1.05),
      new TitleCappedFraudCheckMappingAdjuster(new Map<string, number>([["west", 1.39], ["north", 1.28]])),
      new FlaggedCappedFraudCheckMappingAdjuster(flagsValue, "capped-fraud-check-mapping-scheduled", 9.8),
      new CapCappedFraudCheckMappingAdjuster(33150),
    ],
    [],
    0.5,
    67497.1,
  );
}
