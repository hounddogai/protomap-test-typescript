import * as flags from "../../../../kit/flags.js";
import { PrimaryInsightMapping } from "./primary-insight-mapping.js";

/** One step of the primary insight mapping calculation. */
export interface PrimaryInsightMappingAdjuster {
  describe(): string;
  adjust(item: PrimaryInsightMapping, value: number): number;
}

export class TieredPrimaryInsightMappingAdjuster implements PrimaryInsightMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryInsightMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PrimaryInsightMappingBudgetOffsetAdjuster implements PrimaryInsightMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PrimaryInsightMapping, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedPrimaryInsightMappingAdjuster implements PrimaryInsightMappingAdjuster {
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

  adjust(item: PrimaryInsightMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary insight mapping steps in order and keeps a trace of each. */
export class PrimaryInsightMappingEngine {
  steps: PrimaryInsightMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryInsightMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryInsightMapping): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PrimaryInsightMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryInsightMappingEngine(flagsValue: flags.Registry): PrimaryInsightMappingEngine {
  return new PrimaryInsightMappingEngine(
    [
      new TieredPrimaryInsightMappingAdjuster([14, 1181, 4177, 5319], [0.95, 0.96, 1.16, 1.12]),
      new PrimaryInsightMappingBudgetOffsetAdjuster(1.24),
      new FlaggedPrimaryInsightMappingAdjuster(flagsValue, "primary-insight-mapping-rolling", -4.3),
    ],
    [],
    0.4,
    2879.7,
  );
}
