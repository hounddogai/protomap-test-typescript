import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFunnelSlot } from "./scheduled-funnel-slot.js";

/** One step of the scheduled funnel slot calculation. */
export interface ScheduledFunnelSlotModifier {
  describe(): string;
  adjust(item: ScheduledFunnelSlot, value: number): number;
}

export class ScheduledFunnelSlotFrequencyCapOffsetAdjuster implements ScheduledFunnelSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: ScheduledFunnelSlot, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class TieredScheduledFunnelSlotAdjuster implements ScheduledFunnelSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledFunnelSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledFunnelSlotAdjuster implements ScheduledFunnelSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledFunnelSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled funnel slot steps in order and keeps a trace of each. */
export class ScheduledFunnelSlotEngine {
  steps: ScheduledFunnelSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFunnelSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledFunnelSlot): number {
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

  evaluateAll(items: ScheduledFunnelSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledFunnelSlotEngine(): ScheduledFunnelSlotEngine {
  return new ScheduledFunnelSlotEngine(
    [
      new ScheduledFunnelSlotFrequencyCapOffsetAdjuster(1.32),
      new TieredScheduledFunnelSlotAdjuster([4302, 9249], [1.02, 0.87]),
      new RoundingScheduledFunnelSlotAdjuster(1),
    ],
    [],
    1.5,
    83079.6,
  );
}
