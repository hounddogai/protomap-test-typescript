import * as numbers from "../../../../kit/numbers.js";
import { DefaultRedemptionException } from "./default-redemption-exception.js";

/** One step of the default redemption exception calculation. */
export interface DefaultRedemptionExceptionModifier {
  describe(): string;
  adjust(item: DefaultRedemptionException, value: number): number;
}

export class TieredDefaultRedemptionExceptionAdjuster implements DefaultRedemptionExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultRedemptionException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleDefaultRedemptionExceptionAdjuster implements DefaultRedemptionExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DefaultRedemptionException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DefaultRedemptionExceptionSendAtOffsetAdjuster implements DefaultRedemptionExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: DefaultRedemptionException, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class PercentDefaultRedemptionExceptionAdjuster implements DefaultRedemptionExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultRedemptionException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultRedemptionExceptionAdjuster implements DefaultRedemptionExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultRedemptionException, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default redemption exception steps in order and keeps a trace of each. */
export class DefaultRedemptionExceptionEngine {
  steps: DefaultRedemptionExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultRedemptionExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultRedemptionException): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: DefaultRedemptionException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultRedemptionExceptionEngine(): DefaultRedemptionExceptionEngine {
  return new DefaultRedemptionExceptionEngine(
    [
      new TieredDefaultRedemptionExceptionAdjuster([1125, 3581, 4531, 6085], [0.98, 1.06, 1.12, 0.91]),
      new LocaleDefaultRedemptionExceptionAdjuster(new Map<string, number>([["central", 1]])),
      new DefaultRedemptionExceptionSendAtOffsetAdjuster(1.74),
      new PercentDefaultRedemptionExceptionAdjuster(-2.4),
      new CapDefaultRedemptionExceptionAdjuster(37536),
    ],
    [],
    4.9,
    39878,
  );
}
