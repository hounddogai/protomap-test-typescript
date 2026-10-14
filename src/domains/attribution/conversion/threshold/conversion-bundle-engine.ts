import * as numbers from "../../../../kit/numbers.js";
import { ConversionBundle } from "./conversion-bundle.js";

/** One step of the conversion bundle calculation. */
export interface ConversionBundleModifier {
  describe(): string;
  adjust(item: ConversionBundle, value: number): number;
}

export class ConversionBundleQuantityOffsetAdjuster implements ConversionBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ConversionBundle, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredConversionBundleAdjuster implements ConversionBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapConversionBundleAdjuster implements ConversionBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentConversionBundleAdjuster implements ConversionBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingConversionBundleAdjuster implements ConversionBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the conversion bundle steps in order and keeps a trace of each. */
export class ConversionBundleEngine {
  steps: ConversionBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ConversionBundle): number {
    let current = item.netValue();
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

  evaluateAll(items: ConversionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultConversionBundleEngine(): ConversionBundleEngine {
  return new ConversionBundleEngine(
    [
      new ConversionBundleQuantityOffsetAdjuster(0.59),
      new TieredConversionBundleAdjuster([9658, 9939], [1.05, 0.92]),
      new CapConversionBundleAdjuster(19750),
      new PercentConversionBundleAdjuster(-14.8),
      new RoundingConversionBundleAdjuster(0.5),
    ],
    [],
    4.2,
    53329.6,
  );
}
