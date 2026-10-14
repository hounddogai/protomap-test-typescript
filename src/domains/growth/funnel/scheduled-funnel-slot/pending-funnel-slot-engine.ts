import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingFunnelSlot } from "./pending-funnel-slot.js";

/** One step of the pending funnel slot calculation. */
export interface PendingFunnelSlotModifier {
  describe(): string;
  adjust(item: PendingFunnelSlot, value: number): number;
}

export class CountryPendingFunnelSlotAdjuster implements PendingFunnelSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PendingFunnelSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPendingFunnelSlotAdjuster implements PendingFunnelSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingFunnelSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPendingFunnelSlotAdjuster implements PendingFunnelSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingFunnelSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPendingFunnelSlotAdjuster implements PendingFunnelSlotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingFunnelSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPendingFunnelSlotAdjuster implements PendingFunnelSlotModifier {
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

  adjust(item: PendingFunnelSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingFunnelSlotAdjuster implements PendingFunnelSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingFunnelSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending funnel slot steps in order and keeps a trace of each. */
export class PendingFunnelSlotEngine {
  steps: PendingFunnelSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingFunnelSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingFunnelSlot): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: PendingFunnelSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingFunnelSlotEngine(flagsValue: flags.Registry): PendingFunnelSlotEngine {
  return new PendingFunnelSlotEngine(
    [
      new CountryPendingFunnelSlotAdjuster(
        new Map<string, number>([["online", 1.13], ["east", 0.86], ["retail", 1.38]]),
      ),
      new TieredPendingFunnelSlotAdjuster([4881, 8915], [0.86, 0.88]),
      new RoundingPendingFunnelSlotAdjuster(0.5),
      new MinimumPendingFunnelSlotAdjuster(35.9),
      new FlaggedPendingFunnelSlotAdjuster(flagsValue, "pending-funnel-slot-capped", -8.3),
      new CapPendingFunnelSlotAdjuster(27256),
    ],
    [],
    3.7,
    70738.1,
  );
}
