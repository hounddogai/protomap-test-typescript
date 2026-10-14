import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionQuota } from "./conversion-quota.js";

/** One step of the conversion quota calculation. */
export interface ConversionQuotaFactor {
  describe(): string;
  adjust(item: ConversionQuota, value: number): number;
}

export class CapConversionQuotaAdjuster implements ConversionQuotaFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingConversionQuotaAdjuster implements ConversionQuotaFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumConversionQuotaAdjuster implements ConversionQuotaFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentConversionQuotaAdjuster implements ConversionQuotaFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameConversionQuotaAdjuster implements ConversionQuotaFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ConversionQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedConversionQuotaAdjuster implements ConversionQuotaFactor {
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

  adjust(item: ConversionQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion quota steps in order and keeps a trace of each. */
export class ConversionQuotaEngine {
  steps: ConversionQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ConversionQuota): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ConversionQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultConversionQuotaEngine(flagsValue: flags.Registry): ConversionQuotaEngine {
  return new ConversionQuotaEngine(
    [
      new CapConversionQuotaAdjuster(19540),
      new RoundingConversionQuotaAdjuster(0.25),
      new MinimumConversionQuotaAdjuster(26.1),
      new PercentConversionQuotaAdjuster(-14.8),
      new NameConversionQuotaAdjuster(new Map<string, number>([["central", 0.79], ["south", 0.99]])),
      new FlaggedConversionQuotaAdjuster(flagsValue, "conversion-quota-manual", -4.7),
    ],
    [],
    4.7,
    27416.2,
  );
}
