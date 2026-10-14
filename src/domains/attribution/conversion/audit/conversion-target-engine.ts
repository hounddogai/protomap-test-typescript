import * as flags from "../../../../kit/flags.js";
import { ConversionTarget } from "./conversion-target.js";

/** One step of the conversion target calculation. */
export interface ConversionTargetAdjuster {
  describe(): string;
  adjust(item: ConversionTarget, value: number): number;
}

export class ConversionTargetPriorityOffsetAdjuster implements ConversionTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: ConversionTarget, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class TieredConversionTargetAdjuster implements ConversionTargetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumConversionTargetAdjuster implements ConversionTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedConversionTargetAdjuster implements ConversionTargetAdjuster {
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

  adjust(item: ConversionTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion target steps in order and keeps a trace of each. */
export class ConversionTargetEngine {
  steps: ConversionTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionTarget): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ConversionTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionTargetEngine(flagsValue: flags.Registry): ConversionTargetEngine {
  return new ConversionTargetEngine(
    [
      new ConversionTargetPriorityOffsetAdjuster(1.25),
      new TieredConversionTargetAdjuster([2159, 6817, 7201, 9680], [0.88, 1.13, 0.96, 1.07]),
      new MinimumConversionTargetAdjuster(49.2),
      new FlaggedConversionTargetAdjuster(flagsValue, "conversion-target-weighted", -7.9),
    ],
    [],
    3.9,
    20205.2,
  );
}
