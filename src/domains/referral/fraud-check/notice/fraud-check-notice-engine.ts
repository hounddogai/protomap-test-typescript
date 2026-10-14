import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckNotice } from "./fraud-check-notice.js";

/** One step of the fraud check notice calculation. */
export interface FraudCheckNoticeAdjuster {
  describe(): string;
  adjust(item: FraudCheckNotice, value: number): number;
}

export class FraudCheckNoticeRatioOffsetAdjuster implements FraudCheckNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: FraudCheckNotice, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class TieredFraudCheckNoticeAdjuster implements FraudCheckNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFraudCheckNoticeAdjuster implements FraudCheckNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fraud check notice steps in order and keeps a trace of each. */
export class FraudCheckNoticeEngine {
  steps: FraudCheckNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FraudCheckNotice): number {
    let current = item.projectedValue();
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

  evaluateAll(items: FraudCheckNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFraudCheckNoticeEngine(): FraudCheckNoticeEngine {
  return new FraudCheckNoticeEngine(
    [
      new FraudCheckNoticeRatioOffsetAdjuster(1.71),
      new TieredFraudCheckNoticeAdjuster([1961, 3058, 6460], [0.81, 1.19, 1.06]),
      new CapFraudCheckNoticeAdjuster(34948),
    ],
    [],
    3.2,
    81119.4,
  );
}
