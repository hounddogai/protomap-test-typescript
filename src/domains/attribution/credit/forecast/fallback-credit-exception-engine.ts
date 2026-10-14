import * as numbers from "../../../../kit/numbers.js";
import { FallbackCreditException } from "./fallback-credit-exception.js";

/** One step of the fallback credit exception calculation. */
export interface FallbackCreditExceptionModifier {
  describe(): string;
  adjust(item: FallbackCreditException, value: number): number;
}

export class CapFallbackCreditExceptionAdjuster implements FallbackCreditExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackCreditException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackCreditExceptionAdjuster implements FallbackCreditExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackCreditException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FallbackCreditExceptionClicksOffsetAdjuster implements FallbackCreditExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: FallbackCreditException, value: number): number {
    return value + item.clicks * this.weight;
  }
}

/** Runs the fallback credit exception steps in order and keeps a trace of each. */
export class FallbackCreditExceptionEngine {
  steps: FallbackCreditExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackCreditExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackCreditException): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: FallbackCreditException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackCreditExceptionEngine(): FallbackCreditExceptionEngine {
  return new FallbackCreditExceptionEngine(
    [
      new CapFallbackCreditExceptionAdjuster(4576),
      new TieredFallbackCreditExceptionAdjuster([4871, 6146, 9472], [1.17, 1.13, 1.01]),
      new FallbackCreditExceptionClicksOffsetAdjuster(0.13),
    ],
    [],
    1.2,
    72434.5,
  );
}
