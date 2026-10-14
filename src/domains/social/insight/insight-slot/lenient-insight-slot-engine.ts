import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientInsightSlot } from "./lenient-insight-slot.js";

/** One step of the lenient insight slot calculation. */
export interface LenientInsightSlotModifier {
  describe(): string;
  adjust(item: LenientInsightSlot, value: number): number;
}

export class FlaggedLenientInsightSlotAdjuster implements LenientInsightSlotModifier {
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

  adjust(item: LenientInsightSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LenientInsightSlotSendAtOffsetAdjuster implements LenientInsightSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: LenientInsightSlot, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class TieredLenientInsightSlotAdjuster implements LenientInsightSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientInsightSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient insight slot steps in order and keeps a trace of each. */
export class LenientInsightSlotEngine {
  steps: LenientInsightSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientInsightSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientInsightSlot): number {
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

  evaluateAll(items: LenientInsightSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientInsightSlotEngine(flagsValue: flags.Registry): LenientInsightSlotEngine {
  return new LenientInsightSlotEngine(
    [
      new FlaggedLenientInsightSlotAdjuster(flagsValue, "lenient-insight-slot-manual", -9.7),
      new LenientInsightSlotSendAtOffsetAdjuster(0.46),
      new TieredLenientInsightSlotAdjuster([3613, 4971, 8406, 9698], [0.97, 1.01, 1.13, 1]),
    ],
    [],
    4,
    25172.2,
  );
}
