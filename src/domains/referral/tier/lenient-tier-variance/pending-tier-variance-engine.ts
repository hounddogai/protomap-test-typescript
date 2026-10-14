import * as numbers from "../../../../kit/numbers.js";
import { PendingTierVariance } from "./pending-tier-variance.js";

/** One step of the pending tier variance calculation. */
export interface PendingTierVarianceModifier {
  describe(): string;
  adjust(item: PendingTierVariance, value: number): number;
}

export class RoundingPendingTierVarianceAdjuster implements PendingTierVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingTierVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPendingTierVarianceAdjuster implements PendingTierVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingTierVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NamePendingTierVarianceAdjuster implements PendingTierVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PendingTierVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending tier variance steps in order and keeps a trace of each. */
export class PendingTierVarianceEngine {
  steps: PendingTierVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingTierVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingTierVariance): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PendingTierVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingTierVarianceEngine(): PendingTierVarianceEngine {
  return new PendingTierVarianceEngine(
    [
      new RoundingPendingTierVarianceAdjuster(0.1),
      new TieredPendingTierVarianceAdjuster([3811, 7983, 8462], [1.19, 1.05, 0.99]),
      new NamePendingTierVarianceAdjuster(new Map<string, number>([["central", 0.97], ["east", 0.73]])),
    ],
    [],
    4.1,
    58217.2,
  );
}
