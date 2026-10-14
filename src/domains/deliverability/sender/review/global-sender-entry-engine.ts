import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalSenderEntry } from "./global-sender-entry.js";

/** One step of the global sender entry calculation. */
export interface GlobalSenderEntryAdjuster {
  describe(): string;
  adjust(item: GlobalSenderEntry, value: number): number;
}

export class FlaggedGlobalSenderEntryAdjuster implements GlobalSenderEntryAdjuster {
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

  adjust(item: GlobalSenderEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalSenderEntryAdjuster implements GlobalSenderEntryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalSenderEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredGlobalSenderEntryAdjuster implements GlobalSenderEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalSenderEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapGlobalSenderEntryAdjuster implements GlobalSenderEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalSenderEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingGlobalSenderEntryAdjuster implements GlobalSenderEntryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalSenderEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelGlobalSenderEntryAdjuster implements GlobalSenderEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: GlobalSenderEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global sender entry steps in order and keeps a trace of each. */
export class GlobalSenderEntryEngine {
  steps: GlobalSenderEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSenderEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalSenderEntry): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: GlobalSenderEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalSenderEntryEngine(flagsValue: flags.Registry): GlobalSenderEntryEngine {
  return new GlobalSenderEntryEngine(
    [
      new FlaggedGlobalSenderEntryAdjuster(flagsValue, "global-sender-entry-tiered", -1.3),
      new MinimumGlobalSenderEntryAdjuster(22.8),
      new TieredGlobalSenderEntryAdjuster([1557, 2080, 7134], [1, 0.96, 0.88]),
      new CapGlobalSenderEntryAdjuster(13577),
      new RoundingGlobalSenderEntryAdjuster(0.1),
      new ChannelGlobalSenderEntryAdjuster(
        new Map<string, number>([["retail", 0.73], ["central", 1], ["south", 0.71]]),
      ),
    ],
    [],
    3.8,
    62155.9,
  );
}
