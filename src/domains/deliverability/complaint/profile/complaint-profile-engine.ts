import * as flags from "../../../../kit/flags.js";
import { ComplaintProfile } from "./complaint-profile.js";

/** One step of the complaint profile calculation. */
export interface ComplaintProfileAdjuster {
  describe(): string;
  adjust(item: ComplaintProfile, value: number): number;
}

export class TieredComplaintProfileAdjuster implements ComplaintProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ComplaintProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ComplaintProfileOpenRateOffsetAdjuster implements ComplaintProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ComplaintProfile, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class PercentComplaintProfileAdjuster implements ComplaintProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleComplaintProfileAdjuster implements ComplaintProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ComplaintProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedComplaintProfileAdjuster implements ComplaintProfileAdjuster {
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

  adjust(item: ComplaintProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the complaint profile steps in order and keeps a trace of each. */
export class ComplaintProfileEngine {
  steps: ComplaintProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintProfile): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ComplaintProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintProfileEngine(flagsValue: flags.Registry): ComplaintProfileEngine {
  return new ComplaintProfileEngine(
    [
      new TieredComplaintProfileAdjuster([1509, 3228], [0.8, 0.99]),
      new ComplaintProfileOpenRateOffsetAdjuster(0.43),
      new PercentComplaintProfileAdjuster(21.1),
      new TitleComplaintProfileAdjuster(
        new Map<string, number>([["central", 0.84], ["online", 1.21], ["north", 0.95]]),
      ),
      new FlaggedComplaintProfileAdjuster(flagsValue, "complaint-profile-fallback", 6.4),
    ],
    [],
    0.8,
    86929,
  );
}
