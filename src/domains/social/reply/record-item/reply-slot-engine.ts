import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplySlot } from "./reply-slot.js";

/** One step of the reply slot calculation. */
export interface ReplySlotFactor {
  describe(): string;
  adjust(item: ReplySlot, value: number): number;
}

export class FlaggedReplySlotAdjuster implements ReplySlotFactor {
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

  adjust(item: ReplySlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredReplySlotAdjuster implements ReplySlotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplySlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ReplySlotFloorValueOffsetAdjuster implements ReplySlotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: ReplySlot, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class PercentReplySlotAdjuster implements ReplySlotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplySlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapReplySlotAdjuster implements ReplySlotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplySlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the reply slot steps in order and keeps a trace of each. */
export class ReplySlotEngine {
  steps: ReplySlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplySlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReplySlot): number {
    let current = item.netVolume();
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

  evaluateAll(items: ReplySlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReplySlotEngine(flagsValue: flags.Registry): ReplySlotEngine {
  return new ReplySlotEngine(
    [
      new FlaggedReplySlotAdjuster(flagsValue, "reply-slot-default", -0.2),
      new TieredReplySlotAdjuster([1846, 2479, 7698], [0.92, 1.14, 1.01]),
      new ReplySlotFloorValueOffsetAdjuster(0.59),
      new PercentReplySlotAdjuster(8.6),
      new CapReplySlotAdjuster(1991),
    ],
    [],
    2,
    76404.2,
  );
}
