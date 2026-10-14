import * as flags from "../../../../kit/flags.js";
import { GlobalSlaMilestone } from "./global-sla-milestone.js";

/** One step of the global sla milestone calculation. */
export interface GlobalSlaMilestoneStep {
  describe(): string;
  adjust(item: GlobalSlaMilestone, value: number): number;
}

export class GlobalSlaMilestoneBatchSizeOffsetAdjuster implements GlobalSlaMilestoneStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: GlobalSlaMilestone, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class FlaggedGlobalSlaMilestoneAdjuster implements GlobalSlaMilestoneStep {
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

  adjust(item: GlobalSlaMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelGlobalSlaMilestoneAdjuster implements GlobalSlaMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: GlobalSlaMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumGlobalSlaMilestoneAdjuster implements GlobalSlaMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalSlaMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalSlaMilestoneAdjuster implements GlobalSlaMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalSlaMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global sla milestone steps in order and keeps a trace of each. */
export class GlobalSlaMilestoneEngine {
  steps: GlobalSlaMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSlaMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalSlaMilestone): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: GlobalSlaMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalSlaMilestoneEngine(flagsValue: flags.Registry): GlobalSlaMilestoneEngine {
  return new GlobalSlaMilestoneEngine(
    [
      new GlobalSlaMilestoneBatchSizeOffsetAdjuster(0.66),
      new FlaggedGlobalSlaMilestoneAdjuster(flagsValue, "global-sla-milestone-strict", -9.5),
      new ChannelGlobalSlaMilestoneAdjuster(new Map<string, number>([["retail", 1.01]])),
      new MinimumGlobalSlaMilestoneAdjuster(16.8),
      new PercentGlobalSlaMilestoneAdjuster(16.2),
    ],
    [],
    1,
    90528.5,
  );
}
