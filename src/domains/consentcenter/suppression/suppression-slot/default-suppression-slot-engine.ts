import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultSuppressionSlot } from "./default-suppression-slot.js";

/** One step of the default suppression slot calculation. */
export interface DefaultSuppressionSlotModifier {
  describe(): string;
  adjust(item: DefaultSuppressionSlot, value: number): number;
}

export class FlaggedDefaultSuppressionSlotAdjuster implements DefaultSuppressionSlotModifier {
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

  adjust(item: DefaultSuppressionSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultSuppressionSlotAdjuster implements DefaultSuppressionSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultSuppressionSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDefaultSuppressionSlotAdjuster implements DefaultSuppressionSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultSuppressionSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDefaultSuppressionSlotAdjuster implements DefaultSuppressionSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultSuppressionSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default suppression slot steps in order and keeps a trace of each. */
export class DefaultSuppressionSlotEngine {
  steps: DefaultSuppressionSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultSuppressionSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultSuppressionSlot): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: DefaultSuppressionSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultSuppressionSlotEngine(flagsValue: flags.Registry): DefaultSuppressionSlotEngine {
  return new DefaultSuppressionSlotEngine(
    [
      new FlaggedDefaultSuppressionSlotAdjuster(flagsValue, "default-suppression-slot-default", 1.6),
      new TieredDefaultSuppressionSlotAdjuster([4706, 7238, 9625], [1.13, 0.89, 0.93]),
      new RoundingDefaultSuppressionSlotAdjuster(5),
      new PercentDefaultSuppressionSlotAdjuster(-19.1),
    ],
    [],
    3.1,
    85591.3,
  );
}
