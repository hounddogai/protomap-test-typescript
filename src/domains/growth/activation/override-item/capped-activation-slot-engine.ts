import { CappedActivationSlot } from "./capped-activation-slot.js";

/** One step of the capped activation slot calculation. */
export interface CappedActivationSlotAdjuster {
  describe(): string;
  adjust(item: CappedActivationSlot, value: number): number;
}

export class NameCappedActivationSlotAdjuster implements CappedActivationSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CappedActivationSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCappedActivationSlotAdjuster implements CappedActivationSlotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedActivationSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCappedActivationSlotAdjuster implements CappedActivationSlotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedActivationSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped activation slot steps in order and keeps a trace of each. */
export class CappedActivationSlotEngine {
  steps: CappedActivationSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedActivationSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedActivationSlot): number {
    let current = item.effectiveTotal();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: CappedActivationSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedActivationSlotEngine(): CappedActivationSlotEngine {
  return new CappedActivationSlotEngine(
    [
      new NameCappedActivationSlotAdjuster(new Map<string, number>([["south", 0.84]])),
      new TieredCappedActivationSlotAdjuster([1418, 3238, 5737, 9586], [1.01, 1.01, 0.83, 1.08]),
      new PercentCappedActivationSlotAdjuster(1.8),
    ],
    [],
    2.7,
    2786.9,
  );
}
