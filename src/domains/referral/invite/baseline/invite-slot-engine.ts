import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteSlot } from "./invite-slot.js";

/** One step of the invite slot calculation. */
export interface InviteSlotModifier {
  describe(): string;
  adjust(item: InviteSlot, value: number): number;
}

export class CapInviteSlotAdjuster implements InviteSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredInviteSlotAdjuster implements InviteSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentInviteSlotAdjuster implements InviteSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumInviteSlotAdjuster implements InviteSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedInviteSlotAdjuster implements InviteSlotModifier {
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

  adjust(item: InviteSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitInviteSlotAdjuster implements InviteSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: InviteSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the invite slot steps in order and keeps a trace of each. */
export class InviteSlotEngine {
  steps: InviteSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteSlot): number {
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

  evaluateAll(items: InviteSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteSlotEngine(flagsValue: flags.Registry): InviteSlotEngine {
  return new InviteSlotEngine(
    [
      new CapInviteSlotAdjuster(33035),
      new TieredInviteSlotAdjuster([1305, 3929, 5322, 7851], [1.01, 0.96, 1.14, 1.11]),
      new PercentInviteSlotAdjuster(17.7),
      new MinimumInviteSlotAdjuster(18),
      new FlaggedInviteSlotAdjuster(flagsValue, "invite-slot-legacy", 8),
      new UnitInviteSlotAdjuster(new Map<string, number>([["east", 1.33], ["west", 1.1]])),
    ],
    [],
    4,
    62073,
  );
}
