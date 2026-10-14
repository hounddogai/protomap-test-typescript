import * as flags from "../../../../kit/flags.js";
import { RetentionMetric } from "./retention-metric.js";

/** One step of the retention metric calculation. */
export interface RetentionMetricModifier {
  describe(): string;
  adjust(item: RetentionMetric, value: number): number;
}

export class NameRetentionMetricAdjuster implements RetentionMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RetentionMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRetentionMetricAdjuster implements RetentionMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRetentionMetricAdjuster implements RetentionMetricModifier {
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

  adjust(item: RetentionMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention metric steps in order and keeps a trace of each. */
export class RetentionMetricEngine {
  steps: RetentionMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RetentionMetric): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: RetentionMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRetentionMetricEngine(flagsValue: flags.Registry): RetentionMetricEngine {
  return new RetentionMetricEngine(
    [
      new NameRetentionMetricAdjuster(
        new Map<string, number>([["north", 0.81], ["south", 1.07], ["online", 1.35]]),
      ),
      new TieredRetentionMetricAdjuster([162, 453, 3548], [1.2, 1.02, 1.08]),
      new FlaggedRetentionMetricAdjuster(flagsValue, "retention-metric-global", 3.4),
    ],
    [],
    2.2,
    3226,
  );
}
