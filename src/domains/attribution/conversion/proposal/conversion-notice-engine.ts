import { ConversionNotice } from "./conversion-notice.js";

/** One step of the conversion notice calculation. */
export interface ConversionNoticeStep {
  describe(): string;
  adjust(item: ConversionNotice, value: number): number;
}

export class MinimumConversionNoticeAdjuster implements ConversionNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredConversionNoticeAdjuster implements ConversionNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapConversionNoticeAdjuster implements ConversionNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ConversionNoticeRetriesOffsetAdjuster implements ConversionNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ConversionNotice, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the conversion notice steps in order and keeps a trace of each. */
export class ConversionNoticeEngine {
  steps: ConversionNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ConversionNotice): number {
    let current = item.netExposure();
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

  evaluateAll(items: ConversionNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultConversionNoticeEngine(): ConversionNoticeEngine {
  return new ConversionNoticeEngine(
    [
      new MinimumConversionNoticeAdjuster(30.9),
      new TieredConversionNoticeAdjuster([5152, 5857], [1.05, 1]),
      new CapConversionNoticeAdjuster(13811),
      new ConversionNoticeRetriesOffsetAdjuster(1.13),
    ],
    [],
    2.3,
    50664.2,
  );
}
