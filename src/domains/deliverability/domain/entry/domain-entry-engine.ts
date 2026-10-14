import * as flags from "../../../../kit/flags.js";
import { DomainEntry } from "./domain-entry.js";

/** One step of the domain entry calculation. */
export interface DomainEntryAdjuster {
  describe(): string;
  adjust(item: DomainEntry, value: number): number;
}

export class RegionDomainEntryAdjuster implements DomainEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: DomainEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDomainEntryAdjuster implements DomainEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDomainEntryAdjuster implements DomainEntryAdjuster {
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

  adjust(item: DomainEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDomainEntryAdjuster implements DomainEntryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DomainEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the domain entry steps in order and keeps a trace of each. */
export class DomainEntryEngine {
  steps: DomainEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DomainEntry): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DomainEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDomainEntryEngine(flagsValue: flags.Registry): DomainEntryEngine {
  return new DomainEntryEngine(
    [
      new RegionDomainEntryAdjuster(
        new Map<string, number>([["online", 1.01], ["west", 1.23], ["central", 0.85]]),
      ),
      new TieredDomainEntryAdjuster([1741, 6531], [0.82, 0.99]),
      new FlaggedDomainEntryAdjuster(flagsValue, "domain-entry-manual", 9.4),
      new MinimumDomainEntryAdjuster(31),
    ],
    [],
    0.2,
    18058.5,
  );
}
