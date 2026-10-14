import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictConversionAdjustment } from "./strict-conversion-adjustment.js";

/** One step of the strict conversion adjustment calculation. */
export interface StrictConversionAdjustmentModifier {
  describe(): string;
  adjust(item: StrictConversionAdjustment, value: number): number;
}

export class CapStrictConversionAdjustmentAdjuster implements StrictConversionAdjustmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictConversionAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedStrictConversionAdjustmentAdjuster implements StrictConversionAdjustmentModifier {
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

  adjust(item: StrictConversionAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictConversionAdjustmentAdjuster implements StrictConversionAdjustmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictConversionAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UtmSourceStrictConversionAdjustmentAdjuster implements StrictConversionAdjustmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: StrictConversionAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictConversionAdjustmentAdjuster implements StrictConversionAdjustmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictConversionAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict conversion adjustment steps in order and keeps a trace of each. */
export class StrictConversionAdjustmentEngine {
  steps: StrictConversionAdjustmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictConversionAdjustmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictConversionAdjustment): number {
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

  evaluateAll(items: StrictConversionAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictConversionAdjustmentEngine(flagsValue: flags.Registry): StrictConversionAdjustmentEngine {
  return new StrictConversionAdjustmentEngine(
    [
      new CapStrictConversionAdjustmentAdjuster(3204),
      new FlaggedStrictConversionAdjustmentAdjuster(flagsValue, "strict-conversion-adjustment-global", -0.6),
      new RoundingStrictConversionAdjustmentAdjuster(0.5),
      new UtmSourceStrictConversionAdjustmentAdjuster(
        new Map<string, number>([["east", 1.12], ["online", 1.06]]),
      ),
      new TieredStrictConversionAdjustmentAdjuster([4630, 9428], [1.15, 0.84]),
    ],
    [],
    2.9,
    89112.6,
  );
}
