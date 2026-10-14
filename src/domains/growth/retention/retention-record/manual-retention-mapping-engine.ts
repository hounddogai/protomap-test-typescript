import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualRetentionMapping } from "./manual-retention-mapping.js";

/** One step of the manual retention mapping calculation. */
export interface ManualRetentionMappingModifier {
  describe(): string;
  adjust(item: ManualRetentionMapping, value: number): number;
}

export class TieredManualRetentionMappingAdjuster implements ManualRetentionMappingModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualRetentionMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingManualRetentionMappingAdjuster implements ManualRetentionMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualRetentionMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceManualRetentionMappingAdjuster implements ManualRetentionMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ManualRetentionMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedManualRetentionMappingAdjuster implements ManualRetentionMappingModifier {
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

  adjust(item: ManualRetentionMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualRetentionMappingAdjuster implements ManualRetentionMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualRetentionMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualRetentionMappingAdjuster implements ManualRetentionMappingModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualRetentionMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual retention mapping steps in order and keeps a trace of each. */
export class ManualRetentionMappingEngine {
  steps: ManualRetentionMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRetentionMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualRetentionMapping): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ManualRetentionMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualRetentionMappingEngine(flagsValue: flags.Registry): ManualRetentionMappingEngine {
  return new ManualRetentionMappingEngine(
    [
      new TieredManualRetentionMappingAdjuster([2966, 7432, 9094, 9653], [0.87, 0.97, 1.1, 1.07]),
      new RoundingManualRetentionMappingAdjuster(0.5),
      new SourceManualRetentionMappingAdjuster(new Map<string, number>([["south", 0.98]])),
      new FlaggedManualRetentionMappingAdjuster(flagsValue, "manual-retention-mapping-adaptive", -3.1),
      new CapManualRetentionMappingAdjuster(13117),
      new PercentManualRetentionMappingAdjuster(13.3),
    ],
    [],
    3.2,
    36427.6,
  );
}
