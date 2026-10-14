import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

/** One step of the lenient csat checkpoint calculation. */
export interface LenientCsatCheckpointAdjuster {
  describe(): string;
  adjust(item: LenientCsatCheckpoint, value: number): number;
}

export class CapLenientCsatCheckpointAdjuster implements LenientCsatCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientCsatCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLenientCsatCheckpointAdjuster implements LenientCsatCheckpointAdjuster {
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

  adjust(item: LenientCsatCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientCsatCheckpointAdjuster implements LenientCsatCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientCsatCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientCsatCheckpointAdjuster implements LenientCsatCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientCsatCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelLenientCsatCheckpointAdjuster implements LenientCsatCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LenientCsatCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient csat checkpoint steps in order and keeps a trace of each. */
export class LenientCsatCheckpointEngine {
  steps: LenientCsatCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientCsatCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientCsatCheckpoint): number {
    let current = item.netTotal();
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

  evaluateAll(items: LenientCsatCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientCsatCheckpointEngine(flagsValue: flags.Registry): LenientCsatCheckpointEngine {
  return new LenientCsatCheckpointEngine(
    [
      new CapLenientCsatCheckpointAdjuster(22901),
      new FlaggedLenientCsatCheckpointAdjuster(flagsValue, "lenient-csat-checkpoint-lenient", 2.7),
      new TieredLenientCsatCheckpointAdjuster([3112, 5683], [1.12, 1.07]),
      new RoundingLenientCsatCheckpointAdjuster(0.1),
      new ChannelLenientCsatCheckpointAdjuster(new Map<string, number>([["central", 1.25], ["north", 1.23]])),
    ],
    [],
    2.9,
    57418.2,
  );
}
