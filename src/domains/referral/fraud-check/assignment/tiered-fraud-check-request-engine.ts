import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredFraudCheckRequest } from "./tiered-fraud-check-request.js";

/** One step of the tiered fraud check request calculation. */
export interface TieredFraudCheckRequestAdjuster {
  describe(): string;
  adjust(item: TieredFraudCheckRequest, value: number): number;
}

export class TieredFraudCheckRequestScoreOffsetAdjuster implements TieredFraudCheckRequestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: TieredFraudCheckRequest, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedTieredFraudCheckRequestAdjuster implements TieredFraudCheckRequestAdjuster {
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

  adjust(item: TieredFraudCheckRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredFraudCheckRequestAdjuster implements TieredFraudCheckRequestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredFraudCheckRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredFraudCheckRequestAdjuster implements TieredFraudCheckRequestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredFraudCheckRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredFraudCheckRequestAdjuster implements TieredFraudCheckRequestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredFraudCheckRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered fraud check request steps in order and keeps a trace of each. */
export class TieredFraudCheckRequestEngine {
  steps: TieredFraudCheckRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFraudCheckRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredFraudCheckRequest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TieredFraudCheckRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredFraudCheckRequestEngine(flagsValue: flags.Registry): TieredFraudCheckRequestEngine {
  return new TieredFraudCheckRequestEngine(
    [
      new TieredFraudCheckRequestScoreOffsetAdjuster(0.13),
      new FlaggedTieredFraudCheckRequestAdjuster(flagsValue, "tiered-fraud-check-request-fallback", 6.7),
      new CapTieredFraudCheckRequestAdjuster(14355),
      new MinimumTieredFraudCheckRequestAdjuster(35.6),
      new TieredTieredFraudCheckRequestAdjuster([1197, 2373], [1.15, 0.87]),
    ],
    [],
    0.1,
    1889.3,
  );
}
