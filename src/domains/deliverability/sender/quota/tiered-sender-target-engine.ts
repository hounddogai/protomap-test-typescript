import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredSenderTarget } from "./tiered-sender-target.js";

/** One step of the tiered sender target calculation. */
export interface TieredSenderTargetStep {
  describe(): string;
  adjust(item: TieredSenderTarget, value: number): number;
}

export class RoundingTieredSenderTargetAdjuster implements TieredSenderTargetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredSenderTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTieredSenderTargetAdjuster implements TieredSenderTargetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredSenderTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTieredSenderTargetAdjuster implements TieredSenderTargetStep {
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

  adjust(item: TieredSenderTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredSenderTargetAdjuster implements TieredSenderTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredSenderTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredSenderTargetAdjuster implements TieredSenderTargetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredSenderTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceTieredSenderTargetAdjuster implements TieredSenderTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: TieredSenderTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered sender target steps in order and keeps a trace of each. */
export class TieredSenderTargetEngine {
  steps: TieredSenderTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSenderTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredSenderTarget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TieredSenderTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredSenderTargetEngine(flagsValue: flags.Registry): TieredSenderTargetEngine {
  return new TieredSenderTargetEngine(
    [
      new RoundingTieredSenderTargetAdjuster(0.25),
      new CapTieredSenderTargetAdjuster(24496),
      new FlaggedTieredSenderTargetAdjuster(flagsValue, "tiered-sender-target-manual", 2.6),
      new MinimumTieredSenderTargetAdjuster(26.3),
      new TieredTieredSenderTargetAdjuster([3924, 4097, 8154], [0.97, 1.02, 0.93]),
      new SourceTieredSenderTargetAdjuster(new Map<string, number>([["south", 1.12]])),
    ],
    [],
    4.6,
    47638.1,
  );
}
