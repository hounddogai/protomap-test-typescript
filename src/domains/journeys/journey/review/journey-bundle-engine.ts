import * as flags from "../../../../kit/flags.js";
import { JourneyBundle } from "./journey-bundle.js";

/** One step of the journey bundle calculation. */
export interface JourneyBundleFactor {
  describe(): string;
  adjust(item: JourneyBundle, value: number): number;
}

export class UtmSourceJourneyBundleAdjuster implements JourneyBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: JourneyBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentJourneyBundleAdjuster implements JourneyBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: JourneyBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedJourneyBundleAdjuster implements JourneyBundleFactor {
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

  adjust(item: JourneyBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredJourneyBundleAdjuster implements JourneyBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the journey bundle steps in order and keeps a trace of each. */
export class JourneyBundleEngine {
  steps: JourneyBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: JourneyBundle): number {
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

  evaluateAll(items: JourneyBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultJourneyBundleEngine(flagsValue: flags.Registry): JourneyBundleEngine {
  return new JourneyBundleEngine(
    [
      new UtmSourceJourneyBundleAdjuster(new Map<string, number>([["online", 1.38], ["north", 1.21]])),
      new PercentJourneyBundleAdjuster(-12.8),
      new FlaggedJourneyBundleAdjuster(flagsValue, "journey-bundle-strict", 8.1),
      new TieredJourneyBundleAdjuster([379, 2486, 4332, 7842], [0.88, 1.09, 1.13, 1.06]),
    ],
    [],
    4.3,
    84152.7,
  );
}
