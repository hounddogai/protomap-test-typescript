import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedDomainEntry } from "./capped-domain-entry.js";

/** One step of the capped domain entry calculation. */
export interface CappedDomainEntryStep {
  describe(): string;
  adjust(item: CappedDomainEntry, value: number): number;
}

export class FlaggedCappedDomainEntryAdjuster implements CappedDomainEntryStep {
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

  adjust(item: CappedDomainEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedDomainEntryAdjuster implements CappedDomainEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedDomainEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedDomainEntryAdjuster implements CappedDomainEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedDomainEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedDomainEntryAdjuster implements CappedDomainEntryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedDomainEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped domain entry steps in order and keeps a trace of each. */
export class CappedDomainEntryEngine {
  steps: CappedDomainEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedDomainEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedDomainEntry): number {
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

  evaluateAll(items: CappedDomainEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedDomainEntryEngine(flagsValue: flags.Registry): CappedDomainEntryEngine {
  return new CappedDomainEntryEngine(
    [
      new FlaggedCappedDomainEntryAdjuster(flagsValue, "capped-domain-entry-adaptive", -9.8),
      new TieredCappedDomainEntryAdjuster([4203, 7095], [0.96, 1.01]),
      new MinimumCappedDomainEntryAdjuster(20.2),
      new RoundingCappedDomainEntryAdjuster(1),
    ],
    [],
    1.5,
    4841.4,
  );
}
