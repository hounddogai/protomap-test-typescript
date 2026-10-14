import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalEscalationVariance } from "./regional-escalation-variance.js";

/** One step of the regional escalation variance calculation. */
export interface RegionalEscalationVarianceStep {
  describe(): string;
  adjust(item: RegionalEscalationVariance, value: number): number;
}

export class MinimumRegionalEscalationVarianceAdjuster implements RegionalEscalationVarianceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalEscalationVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionalEscalationVarianceThresholdOffsetAdjuster implements RegionalEscalationVarianceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: RegionalEscalationVariance, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingRegionalEscalationVarianceAdjuster implements RegionalEscalationVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalEscalationVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRegionalEscalationVarianceAdjuster implements RegionalEscalationVarianceStep {
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

  adjust(item: RegionalEscalationVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategoryRegionalEscalationVarianceAdjuster implements RegionalEscalationVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: RegionalEscalationVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRegionalEscalationVarianceAdjuster implements RegionalEscalationVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalEscalationVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional escalation variance steps in order and keeps a trace of each. */
export class RegionalEscalationVarianceEngine {
  steps: RegionalEscalationVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalEscalationVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalEscalationVariance): number {
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

  evaluateAll(items: RegionalEscalationVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalEscalationVarianceEngine(flagsValue: flags.Registry): RegionalEscalationVarianceEngine {
  return new RegionalEscalationVarianceEngine(
    [
      new MinimumRegionalEscalationVarianceAdjuster(23.7),
      new RegionalEscalationVarianceThresholdOffsetAdjuster(0.38),
      new RoundingRegionalEscalationVarianceAdjuster(1),
      new FlaggedRegionalEscalationVarianceAdjuster(flagsValue, "regional-escalation-variance-batched", -3.4),
      new CategoryRegionalEscalationVarianceAdjuster(new Map<string, number>([["central", 1.12]])),
      new PercentRegionalEscalationVarianceAdjuster(0.5),
    ],
    [],
    1,
    87123.5,
  );
}
