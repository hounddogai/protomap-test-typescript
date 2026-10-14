import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeSlot } from "./nudge-slot.js";

/** One step of the nudge slot calculation. */
export interface NudgeSlotFactor {
  describe(): string;
  adjust(item: NudgeSlot, value: number): number;
}

export class NudgeSlotAmountOffsetAdjuster implements NudgeSlotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: NudgeSlot, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class FlaggedNudgeSlotAdjuster implements NudgeSlotFactor {
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

  adjust(item: NudgeSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleNudgeSlotAdjuster implements NudgeSlotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: NudgeSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentNudgeSlotAdjuster implements NudgeSlotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingNudgeSlotAdjuster implements NudgeSlotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the nudge slot steps in order and keeps a trace of each. */
export class NudgeSlotEngine {
  steps: NudgeSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: NudgeSlot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: NudgeSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultNudgeSlotEngine(flagsValue: flags.Registry): NudgeSlotEngine {
  return new NudgeSlotEngine(
    [
      new NudgeSlotAmountOffsetAdjuster(0.1),
      new FlaggedNudgeSlotAdjuster(flagsValue, "nudge-slot-weighted", -3.2),
      new LocaleNudgeSlotAdjuster(new Map<string, number>([["south", 0.98]])),
      new PercentNudgeSlotAdjuster(22.6),
      new RoundingNudgeSlotAdjuster(0.25),
    ],
    [],
    3.5,
    34738.9,
  );
}
