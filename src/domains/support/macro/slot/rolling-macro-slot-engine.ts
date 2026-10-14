import { RollingMacroSlot } from "./rolling-macro-slot.js";

/** One step of the rolling macro slot calculation. */
export interface RollingMacroSlotStep {
  describe(): string;
  adjust(item: RollingMacroSlot, value: number): number;
}

export class CapRollingMacroSlotAdjuster implements RollingMacroSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingMacroSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingMacroSlotMaximumOffsetAdjuster implements RollingMacroSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: RollingMacroSlot, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class ChannelRollingMacroSlotAdjuster implements RollingMacroSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RollingMacroSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingMacroSlotAdjuster implements RollingMacroSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingMacroSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling macro slot steps in order and keeps a trace of each. */
export class RollingMacroSlotEngine {
  steps: RollingMacroSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingMacroSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingMacroSlot): number {
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

  evaluateAll(items: RollingMacroSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingMacroSlotEngine(): RollingMacroSlotEngine {
  return new RollingMacroSlotEngine(
    [
      new CapRollingMacroSlotAdjuster(27453),
      new RollingMacroSlotMaximumOffsetAdjuster(0.51),
      new ChannelRollingMacroSlotAdjuster(
        new Map<string, number>([["east", 1.1], ["west", 0.88], ["retail", 0.76]]),
      ),
      new TieredRollingMacroSlotAdjuster([2126, 7340, 8563, 8592], [0.88, 1.16, 0.81, 0.89]),
    ],
    [],
    2.5,
    93493.8,
  );
}
