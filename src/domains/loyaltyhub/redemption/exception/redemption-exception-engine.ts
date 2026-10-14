import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionException } from "./redemption-exception.js";

/** One step of the redemption exception calculation. */
export interface RedemptionExceptionAdjuster {
  describe(): string;
  adjust(item: RedemptionException, value: number): number;
}

export class FlaggedRedemptionExceptionAdjuster implements RedemptionExceptionAdjuster {
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

  adjust(item: RedemptionException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRedemptionExceptionAdjuster implements RedemptionExceptionAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceRedemptionExceptionAdjuster implements RedemptionExceptionAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RedemptionException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRedemptionExceptionAdjuster implements RedemptionExceptionAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRedemptionExceptionAdjuster implements RedemptionExceptionAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRedemptionExceptionAdjuster implements RedemptionExceptionAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the redemption exception steps in order and keeps a trace of each. */
export class RedemptionExceptionEngine {
  steps: RedemptionExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RedemptionException): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RedemptionException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRedemptionExceptionEngine(flagsValue: flags.Registry): RedemptionExceptionEngine {
  return new RedemptionExceptionEngine(
    [
      new FlaggedRedemptionExceptionAdjuster(flagsValue, "redemption-exception-strict", 7.8),
      new TieredRedemptionExceptionAdjuster([8668, 9967], [0.83, 0.88]),
      new SourceRedemptionExceptionAdjuster(
        new Map<string, number>([["west", 0.94], ["south", 0.87], ["east", 1.4]]),
      ),
      new CapRedemptionExceptionAdjuster(10693),
      new RoundingRedemptionExceptionAdjuster(1),
      new PercentRedemptionExceptionAdjuster(-2.3),
    ],
    [],
    2.3,
    48214.4,
  );
}
