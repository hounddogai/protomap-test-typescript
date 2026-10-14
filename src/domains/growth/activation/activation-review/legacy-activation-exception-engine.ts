import * as numbers from "../../../../kit/numbers.js";
import { LegacyActivationException } from "./legacy-activation-exception.js";

/** One step of the legacy activation exception calculation. */
export interface LegacyActivationExceptionFactor {
  describe(): string;
  adjust(item: LegacyActivationException, value: number): number;
}

export class MinimumLegacyActivationExceptionAdjuster implements LegacyActivationExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyActivationException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLegacyActivationExceptionAdjuster implements LegacyActivationExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyActivationException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLegacyActivationExceptionAdjuster implements LegacyActivationExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyActivationException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameLegacyActivationExceptionAdjuster implements LegacyActivationExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LegacyActivationException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLegacyActivationExceptionAdjuster implements LegacyActivationExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyActivationException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LegacyActivationExceptionEndsAtOffsetAdjuster implements LegacyActivationExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: LegacyActivationException, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the legacy activation exception steps in order and keeps a trace of each. */
export class LegacyActivationExceptionEngine {
  steps: LegacyActivationExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyActivationExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyActivationException): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LegacyActivationException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyActivationExceptionEngine(): LegacyActivationExceptionEngine {
  return new LegacyActivationExceptionEngine(
    [
      new MinimumLegacyActivationExceptionAdjuster(16),
      new CapLegacyActivationExceptionAdjuster(11995),
      new PercentLegacyActivationExceptionAdjuster(8.6),
      new NameLegacyActivationExceptionAdjuster(
        new Map<string, number>([["south", 1.1], ["central", 1.06], ["retail", 0.73]]),
      ),
      new TieredLegacyActivationExceptionAdjuster([3795, 6160, 8089], [1.11, 1.01, 1.19]),
      new LegacyActivationExceptionEndsAtOffsetAdjuster(1.79),
    ],
    [],
    3.8,
    10130.5,
  );
}
