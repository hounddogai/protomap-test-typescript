import * as flags from "../../../../kit/flags.js";
import { DefaultSenderRollup } from "./default-sender-rollup.js";

/** One step of the default sender rollup calculation. */
export interface DefaultSenderRollupStep {
  describe(): string;
  adjust(item: DefaultSenderRollup, value: number): number;
}

export class DefaultSenderRollupWindowDaysOffsetAdjuster implements DefaultSenderRollupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: DefaultSenderRollup, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class FlaggedDefaultSenderRollupAdjuster implements DefaultSenderRollupStep {
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

  adjust(item: DefaultSenderRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultSenderRollupAdjuster implements DefaultSenderRollupStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultSenderRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentDefaultSenderRollupAdjuster implements DefaultSenderRollupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultSenderRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelDefaultSenderRollupAdjuster implements DefaultSenderRollupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DefaultSenderRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default sender rollup steps in order and keeps a trace of each. */
export class DefaultSenderRollupEngine {
  steps: DefaultSenderRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultSenderRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultSenderRollup): number {
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

  evaluateAll(items: DefaultSenderRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultSenderRollupEngine(flagsValue: flags.Registry): DefaultSenderRollupEngine {
  return new DefaultSenderRollupEngine(
    [
      new DefaultSenderRollupWindowDaysOffsetAdjuster(0.72),
      new FlaggedDefaultSenderRollupAdjuster(flagsValue, "default-sender-rollup-default", 6.2),
      new TieredDefaultSenderRollupAdjuster([7387, 8406], [1.07, 1.15]),
      new PercentDefaultSenderRollupAdjuster(-18.8),
      new LabelDefaultSenderRollupAdjuster(
        new Map<string, number>([["retail", 0.78], ["west", 1.14], ["south", 1.09]]),
      ),
    ],
    [],
    3.2,
    55967.7,
  );
}
