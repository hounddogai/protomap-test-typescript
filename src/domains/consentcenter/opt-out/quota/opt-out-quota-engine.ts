import * as numbers from "../../../../kit/numbers.js";
import { OptOutQuota } from "./opt-out-quota.js";

/** One step of the opt out quota calculation. */
export interface OptOutQuotaFactor {
  describe(): string;
  adjust(item: OptOutQuota, value: number): number;
}

export class RoundingOptOutQuotaAdjuster implements OptOutQuotaFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class OptOutQuotaScoreOffsetAdjuster implements OptOutQuotaFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: OptOutQuota, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TieredOptOutQuotaAdjuster implements OptOutQuotaFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the opt out quota steps in order and keeps a trace of each. */
export class OptOutQuotaEngine {
  steps: OptOutQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: OptOutQuota): number {
    let current = item.netLoad();
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

  evaluateAll(items: OptOutQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultOptOutQuotaEngine(): OptOutQuotaEngine {
  return new OptOutQuotaEngine(
    [
      new RoundingOptOutQuotaAdjuster(0.25),
      new OptOutQuotaScoreOffsetAdjuster(1.48),
      new TieredOptOutQuotaAdjuster([388, 2178, 5005], [1.14, 1.13, 0.86]),
    ],
    [],
    0.8,
    65419.7,
  );
}
