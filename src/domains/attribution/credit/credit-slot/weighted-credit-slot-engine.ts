import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedCreditSlot } from "./weighted-credit-slot.js";

/** One step of the weighted credit slot calculation. */
export interface WeightedCreditSlotStep {
  describe(): string;
  adjust(item: WeightedCreditSlot, value: number): number;
}

export class FlaggedWeightedCreditSlotAdjuster implements WeightedCreditSlotStep {
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

  adjust(item: WeightedCreditSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedCreditSlotAdjuster implements WeightedCreditSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedCreditSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WeightedCreditSlotCreatedAtOffsetAdjuster implements WeightedCreditSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: WeightedCreditSlot, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the weighted credit slot steps in order and keeps a trace of each. */
export class WeightedCreditSlotEngine {
  steps: WeightedCreditSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedCreditSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedCreditSlot): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: WeightedCreditSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedCreditSlotEngine(flagsValue: flags.Registry): WeightedCreditSlotEngine {
  return new WeightedCreditSlotEngine(
    [
      new FlaggedWeightedCreditSlotAdjuster(flagsValue, "weighted-credit-slot-adaptive", 0.1),
      new TieredWeightedCreditSlotAdjuster([3250, 8353], [0.93, 1.15]),
      new WeightedCreditSlotCreatedAtOffsetAdjuster(1.11),
    ],
    [],
    4.1,
    4137.7,
  );
}
