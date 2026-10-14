import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionAdjustment } from "./conversion-adjustment.js";

/** One step of the conversion adjustment calculation. */
export interface ConversionAdjustmentFactor {
  describe(): string;
  adjust(item: ConversionAdjustment, value: number): number;
}

export class UnitConversionAdjustmentAdjuster implements ConversionAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ConversionAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedConversionAdjustmentAdjuster implements ConversionAdjustmentFactor {
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

  adjust(item: ConversionAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentConversionAdjustmentAdjuster implements ConversionAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ConversionAdjustmentBudgetOffsetAdjuster implements ConversionAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ConversionAdjustment, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class TieredConversionAdjustmentAdjuster implements ConversionAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingConversionAdjustmentAdjuster implements ConversionAdjustmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the conversion adjustment steps in order and keeps a trace of each. */
export class ConversionAdjustmentEngine {
  steps: ConversionAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionAdjustment): number {
    let current = item.netTotal();
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

  evaluateAll(items: ConversionAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionAdjustmentEngine(flagsValue: flags.Registry): ConversionAdjustmentEngine {
  return new ConversionAdjustmentEngine(
    [
      new UnitConversionAdjustmentAdjuster(
        new Map<string, number>([["south", 1.4], ["north", 0.81], ["online", 1.12]]),
      ),
      new FlaggedConversionAdjustmentAdjuster(flagsValue, "conversion-adjustment-tiered", -0.7),
      new PercentConversionAdjustmentAdjuster(13.9),
      new ConversionAdjustmentBudgetOffsetAdjuster(1.91),
      new TieredConversionAdjustmentAdjuster([4140, 5836, 8407], [1.08, 0.95, 1]),
      new RoundingConversionAdjustmentAdjuster(1),
    ],
    [],
    1.2,
    79270.4,
  );
}
