import * as numbers from "../../../../kit/numbers.js";
import { ManualFraudCheckWindow } from "./manual-fraud-check-window.js";

/** One step of the manual fraud check window calculation. */
export interface ManualFraudCheckWindowAdjuster {
  describe(): string;
  adjust(item: ManualFraudCheckWindow, value: number): number;
}

export class LabelManualFraudCheckWindowAdjuster implements ManualFraudCheckWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ManualFraudCheckWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingManualFraudCheckWindowAdjuster implements ManualFraudCheckWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualFraudCheckWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredManualFraudCheckWindowAdjuster implements ManualFraudCheckWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualFraudCheckWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual fraud check window steps in order and keeps a trace of each. */
export class ManualFraudCheckWindowEngine {
  steps: ManualFraudCheckWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualFraudCheckWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualFraudCheckWindow): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ManualFraudCheckWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualFraudCheckWindowEngine(): ManualFraudCheckWindowEngine {
  return new ManualFraudCheckWindowEngine(
    [
      new LabelManualFraudCheckWindowAdjuster(new Map<string, number>([["retail", 1]])),
      new RoundingManualFraudCheckWindowAdjuster(1),
      new TieredManualFraudCheckWindowAdjuster([7710, 8236, 8823], [1.17, 1.19, 0.95]),
    ],
    [],
    0.2,
    19458.2,
  );
}
