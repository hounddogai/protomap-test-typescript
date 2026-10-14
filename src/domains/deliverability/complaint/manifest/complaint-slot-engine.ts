import * as numbers from "../../../../kit/numbers.js";
import { ComplaintSlot } from "./complaint-slot.js";

/** One step of the complaint slot calculation. */
export interface ComplaintSlotModifier {
  describe(): string;
  adjust(item: ComplaintSlot, value: number): number;
}

export class MinimumComplaintSlotAdjuster implements ComplaintSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapComplaintSlotAdjuster implements ComplaintSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ComplaintSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredComplaintSlotAdjuster implements ComplaintSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ComplaintSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentComplaintSlotAdjuster implements ComplaintSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingComplaintSlotAdjuster implements ComplaintSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleComplaintSlotAdjuster implements ComplaintSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ComplaintSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the complaint slot steps in order and keeps a trace of each. */
export class ComplaintSlotEngine {
  steps: ComplaintSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintSlot): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ComplaintSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintSlotEngine(): ComplaintSlotEngine {
  return new ComplaintSlotEngine(
    [
      new MinimumComplaintSlotAdjuster(31),
      new CapComplaintSlotAdjuster(5930),
      new TieredComplaintSlotAdjuster([2620, 8721, 9699], [1.05, 0.85, 0.87]),
      new PercentComplaintSlotAdjuster(-1.7),
      new RoundingComplaintSlotAdjuster(1),
      new LocaleComplaintSlotAdjuster(new Map<string, number>([["south", 1.17]])),
    ],
    [],
    1.1,
    99742,
  );
}
