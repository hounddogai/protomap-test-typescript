import * as flags from "../../../../kit/flags.js";
import { WeightedMentionAudit } from "./weighted-mention-audit.js";

/** One step of the weighted mention audit calculation. */
export interface WeightedMentionAuditAdjuster {
  describe(): string;
  adjust(item: WeightedMentionAudit, value: number): number;
}

export class FlaggedWeightedMentionAuditAdjuster implements WeightedMentionAuditAdjuster {
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

  adjust(item: WeightedMentionAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedMentionAuditAdjuster implements WeightedMentionAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedMentionAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedMentionAuditAdjuster implements WeightedMentionAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedMentionAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWeightedMentionAuditAdjuster implements WeightedMentionAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedMentionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted mention audit steps in order and keeps a trace of each. */
export class WeightedMentionAuditEngine {
  steps: WeightedMentionAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedMentionAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedMentionAudit): number {
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

  evaluateAll(items: WeightedMentionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedMentionAuditEngine(flagsValue: flags.Registry): WeightedMentionAuditEngine {
  return new WeightedMentionAuditEngine(
    [
      new FlaggedWeightedMentionAuditAdjuster(flagsValue, "weighted-mention-audit-rolling", 4.7),
      new CapWeightedMentionAuditAdjuster(4584),
      new TieredWeightedMentionAuditAdjuster([110, 2106, 4402], [0.98, 1.08, 0.88]),
      new PercentWeightedMentionAuditAdjuster(-12.5),
    ],
    [],
    2.7,
    75809.3,
  );
}
