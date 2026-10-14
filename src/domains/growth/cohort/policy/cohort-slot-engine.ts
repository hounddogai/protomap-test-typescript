import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CohortSlot } from "./cohort-slot.js";

/** One step of the cohort slot calculation. */
export interface CohortSlotModifier {
  describe(): string;
  adjust(item: CohortSlot, value: number): number;
}

export class FlaggedCohortSlotAdjuster implements CohortSlotModifier {
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

  adjust(item: CohortSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCohortSlotAdjuster implements CohortSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCohortSlotAdjuster implements CohortSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCohortSlotAdjuster implements CohortSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryCohortSlotAdjuster implements CohortSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: CohortSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the cohort slot steps in order and keeps a trace of each. */
export class CohortSlotEngine {
  steps: CohortSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CohortSlot): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: CohortSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCohortSlotEngine(flagsValue: flags.Registry): CohortSlotEngine {
  return new CohortSlotEngine(
    [
      new FlaggedCohortSlotAdjuster(flagsValue, "cohort-slot-primary", 5.8),
      new PercentCohortSlotAdjuster(-4.7),
      new RoundingCohortSlotAdjuster(0.1),
      new CapCohortSlotAdjuster(26595),
      new CountryCohortSlotAdjuster(
        new Map<string, number>([["retail", 1.13], ["central", 0.8], ["online", 0.86]]),
      ),
    ],
    [],
    0.6,
    37373.9,
  );
}
