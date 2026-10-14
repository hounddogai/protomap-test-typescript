import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingReputationSlot } from "./pending-reputation-slot.js";

/** One step of the pending reputation slot calculation. */
export interface PendingReputationSlotStep {
  describe(): string;
  adjust(item: PendingReputationSlot, value: number): number;
}

export class FlaggedPendingReputationSlotAdjuster implements PendingReputationSlotStep {
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

  adjust(item: PendingReputationSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPendingReputationSlotAdjuster implements PendingReputationSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingReputationSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingReputationSlotAdjuster implements PendingReputationSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingReputationSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PendingReputationSlotImpressionsOffsetAdjuster implements PendingReputationSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: PendingReputationSlot, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class UtmSourcePendingReputationSlotAdjuster implements PendingReputationSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: PendingReputationSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPendingReputationSlotAdjuster implements PendingReputationSlotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingReputationSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending reputation slot steps in order and keeps a trace of each. */
export class PendingReputationSlotEngine {
  steps: PendingReputationSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingReputationSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingReputationSlot): number {
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

  evaluateAll(items: PendingReputationSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingReputationSlotEngine(flagsValue: flags.Registry): PendingReputationSlotEngine {
  return new PendingReputationSlotEngine(
    [
      new FlaggedPendingReputationSlotAdjuster(flagsValue, "pending-reputation-slot-weighted", -4.5),
      new PercentPendingReputationSlotAdjuster(-18.7),
      new TieredPendingReputationSlotAdjuster([1309, 1848, 8868], [1.01, 0.96, 1.08]),
      new PendingReputationSlotImpressionsOffsetAdjuster(1.12),
      new UtmSourcePendingReputationSlotAdjuster(new Map<string, number>([["south", 0.7], ["west", 0.81]])),
      new RoundingPendingReputationSlotAdjuster(0.05),
    ],
    [],
    3.8,
    62077.7,
  );
}
