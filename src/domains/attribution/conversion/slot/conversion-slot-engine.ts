import * as flags from "../../../../kit/flags.js";
import { ConversionSlot } from "./conversion-slot.js";

/** One step of the conversion slot calculation. */
export interface ConversionSlotAdjuster {
  describe(): string;
  adjust(item: ConversionSlot, value: number): number;
}

export class CapConversionSlotAdjuster implements ConversionSlotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedConversionSlotAdjuster implements ConversionSlotAdjuster {
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

  adjust(item: ConversionSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumConversionSlotAdjuster implements ConversionSlotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelConversionSlotAdjuster implements ConversionSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ConversionSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ConversionSlotSendAtOffsetAdjuster implements ConversionSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: ConversionSlot, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the conversion slot steps in order and keeps a trace of each. */
export class ConversionSlotEngine {
  steps: ConversionSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionSlot): number {
    let current = item.netVolume();
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

  evaluateAll(items: ConversionSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionSlotEngine(flagsValue: flags.Registry): ConversionSlotEngine {
  return new ConversionSlotEngine(
    [
      new CapConversionSlotAdjuster(7155),
      new FlaggedConversionSlotAdjuster(flagsValue, "conversion-slot-seasonal", 6.7),
      new MinimumConversionSlotAdjuster(14.5),
      new ChannelConversionSlotAdjuster(new Map<string, number>([["retail", 1.3], ["south", 0.76]])),
      new ConversionSlotSendAtOffsetAdjuster(1.27),
    ],
    [],
    3.8,
    44806.6,
  );
}
