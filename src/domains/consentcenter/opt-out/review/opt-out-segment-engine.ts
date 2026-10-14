import * as flags from "../../../../kit/flags.js";
import { OptOutSegment } from "./opt-out-segment.js";

/** One step of the opt out segment calculation. */
export interface OptOutSegmentModifier {
  describe(): string;
  adjust(item: OptOutSegment, value: number): number;
}

export class FlaggedOptOutSegmentAdjuster implements OptOutSegmentModifier {
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

  adjust(item: OptOutSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class OptOutSegmentCeilingOffsetAdjuster implements OptOutSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: OptOutSegment, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class CapOptOutSegmentAdjuster implements OptOutSegmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredOptOutSegmentAdjuster implements OptOutSegmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentOptOutSegmentAdjuster implements OptOutSegmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the opt out segment steps in order and keeps a trace of each. */
export class OptOutSegmentEngine {
  steps: OptOutSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutSegment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: OptOutSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutSegmentEngine(flagsValue: flags.Registry): OptOutSegmentEngine {
  return new OptOutSegmentEngine(
    [
      new FlaggedOptOutSegmentAdjuster(flagsValue, "opt-out-segment-batched", 0.6),
      new OptOutSegmentCeilingOffsetAdjuster(0.25),
      new CapOptOutSegmentAdjuster(41821),
      new TieredOptOutSegmentAdjuster([135, 866, 5105, 6346], [1.06, 1.07, 1.09, 0.82]),
      new PercentOptOutSegmentAdjuster(-9.2),
    ],
    [],
    0.6,
    16539.8,
  );
}
