import { CreativeSlot } from "./creative-slot.js";

/** One step of the creative slot calculation. */
export interface CreativeSlotModifier {
  describe(): string;
  adjust(item: CreativeSlot, value: number): number;
}

export class PercentCreativeSlotAdjuster implements CreativeSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreativeSlotAdjuster implements CreativeSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionCreativeSlotAdjuster implements CreativeSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: CreativeSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the creative slot steps in order and keeps a trace of each. */
export class CreativeSlotEngine {
  steps: CreativeSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreativeSlot): number {
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

  evaluateAll(items: CreativeSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreativeSlotEngine(): CreativeSlotEngine {
  return new CreativeSlotEngine(
    [
      new PercentCreativeSlotAdjuster(8.2),
      new TieredCreativeSlotAdjuster([771, 4240, 8775, 9287], [0.99, 0.93, 1.18, 1.04]),
      new RegionCreativeSlotAdjuster(new Map<string, number>([["south", 1.08], ["west", 1.04], ["north", 1.4]])),
    ],
    [],
    0.8,
    18576.9,
  );
}
