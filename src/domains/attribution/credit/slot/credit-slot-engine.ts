import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreditSlot } from "./credit-slot.js";

/** One step of the credit slot calculation. */
export interface CreditSlotStep {
  describe(): string;
  adjust(item: CreditSlot, value: number): number;
}

export class TieredCreditSlotAdjuster implements CreditSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCreditSlotAdjuster implements CreditSlotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreditSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCreditSlotAdjuster implements CreditSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCreditSlotAdjuster implements CreditSlotStep {
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

  adjust(item: CreditSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCreditSlotAdjuster implements CreditSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CreditSlotQuantityOffsetAdjuster implements CreditSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: CreditSlot, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the credit slot steps in order and keeps a trace of each. */
export class CreditSlotEngine {
  steps: CreditSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreditSlot): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: CreditSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreditSlotEngine(flagsValue: flags.Registry): CreditSlotEngine {
  return new CreditSlotEngine(
    [
      new TieredCreditSlotAdjuster([643, 6207], [0.82, 1.18]),
      new RoundingCreditSlotAdjuster(0.1),
      new PercentCreditSlotAdjuster(-6.9),
      new FlaggedCreditSlotAdjuster(flagsValue, "credit-slot-batched", 6.4),
      new MinimumCreditSlotAdjuster(43.5),
      new CreditSlotQuantityOffsetAdjuster(0.82),
    ],
    [],
    1.3,
    30999.7,
  );
}
