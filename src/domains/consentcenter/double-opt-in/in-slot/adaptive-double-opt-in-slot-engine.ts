import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveDoubleOptInSlot } from "./adaptive-double-opt-in-slot.js";

/** One step of the adaptive double opt in slot calculation. */
export interface AdaptiveDoubleOptInSlotStep {
  describe(): string;
  adjust(item: AdaptiveDoubleOptInSlot, value: number): number;
}

export class AdaptiveDoubleOptInSlotBudgetOffsetAdjuster implements AdaptiveDoubleOptInSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: AdaptiveDoubleOptInSlot, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class MinimumAdaptiveDoubleOptInSlotAdjuster implements AdaptiveDoubleOptInSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveDoubleOptInSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingAdaptiveDoubleOptInSlotAdjuster implements AdaptiveDoubleOptInSlotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveDoubleOptInSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelAdaptiveDoubleOptInSlotAdjuster implements AdaptiveDoubleOptInSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: AdaptiveDoubleOptInSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive double opt in slot steps in order and keeps a trace of each. */
export class AdaptiveDoubleOptInSlotEngine {
  steps: AdaptiveDoubleOptInSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDoubleOptInSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveDoubleOptInSlot): number {
    let current = item.weightedValue();
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

  evaluateAll(items: AdaptiveDoubleOptInSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveDoubleOptInSlotEngine(): AdaptiveDoubleOptInSlotEngine {
  return new AdaptiveDoubleOptInSlotEngine(
    [
      new AdaptiveDoubleOptInSlotBudgetOffsetAdjuster(0.12),
      new MinimumAdaptiveDoubleOptInSlotAdjuster(0.6),
      new RoundingAdaptiveDoubleOptInSlotAdjuster(0.1),
      new LabelAdaptiveDoubleOptInSlotAdjuster(new Map<string, number>([["central", 1.17], ["online", 0.83]])),
    ],
    [],
    2.3,
    27925.3,
  );
}
