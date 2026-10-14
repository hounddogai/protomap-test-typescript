import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyWindowSlot } from "./legacy-window-slot.js";

/** One step of the legacy window slot calculation. */
export interface LegacyWindowSlotAdjuster {
  describe(): string;
  adjust(item: LegacyWindowSlot, value: number): number;
}

export class FlaggedLegacyWindowSlotAdjuster implements LegacyWindowSlotAdjuster {
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

  adjust(item: LegacyWindowSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyWindowSlotAdjuster implements LegacyWindowSlotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyWindowSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LegacyWindowSlotRateOffsetAdjuster implements LegacyWindowSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: LegacyWindowSlot, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class CountryLegacyWindowSlotAdjuster implements LegacyWindowSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: LegacyWindowSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy window slot steps in order and keeps a trace of each. */
export class LegacyWindowSlotEngine {
  steps: LegacyWindowSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyWindowSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyWindowSlot): number {
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

  evaluateAll(items: LegacyWindowSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyWindowSlotEngine(flagsValue: flags.Registry): LegacyWindowSlotEngine {
  return new LegacyWindowSlotEngine(
    [
      new FlaggedLegacyWindowSlotAdjuster(flagsValue, "legacy-window-slot-weighted", 9.5),
      new RoundingLegacyWindowSlotAdjuster(5),
      new LegacyWindowSlotRateOffsetAdjuster(1.91),
      new CountryLegacyWindowSlotAdjuster(
        new Map<string, number>([["central", 0.76], ["online", 0.94], ["south", 1]]),
      ),
    ],
    [],
    0.8,
    78878.8,
  );
}
