import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryConversionMapping } from "./primary-conversion-mapping.js";

/** One step of the primary conversion mapping calculation. */
export interface PrimaryConversionMappingFactor {
  describe(): string;
  adjust(item: PrimaryConversionMapping, value: number): number;
}

export class PrimaryConversionMappingExpiresAtOffsetAdjuster implements PrimaryConversionMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: PrimaryConversionMapping, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class PercentPrimaryConversionMappingAdjuster implements PrimaryConversionMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryConversionMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryConversionMappingAdjuster implements PrimaryConversionMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryConversionMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPrimaryConversionMappingAdjuster implements PrimaryConversionMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryConversionMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocalePrimaryConversionMappingAdjuster implements PrimaryConversionMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryConversionMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPrimaryConversionMappingAdjuster implements PrimaryConversionMappingFactor {
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

  adjust(item: PrimaryConversionMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary conversion mapping steps in order and keeps a trace of each. */
export class PrimaryConversionMappingEngine {
  steps: PrimaryConversionMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryConversionMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryConversionMapping): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PrimaryConversionMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryConversionMappingEngine(flagsValue: flags.Registry): PrimaryConversionMappingEngine {
  return new PrimaryConversionMappingEngine(
    [
      new PrimaryConversionMappingExpiresAtOffsetAdjuster(1.51),
      new PercentPrimaryConversionMappingAdjuster(-24.1),
      new RoundingPrimaryConversionMappingAdjuster(0.05),
      new TieredPrimaryConversionMappingAdjuster([1379, 2504, 7388, 9006], [0.92, 1.1, 0.97, 0.89]),
      new LocalePrimaryConversionMappingAdjuster(new Map<string, number>([["west", 0.98]])),
      new FlaggedPrimaryConversionMappingAdjuster(flagsValue, "primary-conversion-mapping-scheduled", -10),
    ],
    [],
    1.9,
    87608.4,
  );
}
