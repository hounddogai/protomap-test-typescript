import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingDomainSummary } from "./rolling-domain-summary.js";

/** One step of the rolling domain summary calculation. */
export interface RollingDomainSummaryFactor {
  describe(): string;
  adjust(item: RollingDomainSummary, value: number): number;
}

export class FlaggedRollingDomainSummaryAdjuster implements RollingDomainSummaryFactor {
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

  adjust(item: RollingDomainSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingDomainSummaryAdjuster implements RollingDomainSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingDomainSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleRollingDomainSummaryAdjuster implements RollingDomainSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingDomainSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRollingDomainSummaryAdjuster implements RollingDomainSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingDomainSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingDomainSummaryAdjuster implements RollingDomainSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingDomainSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling domain summary steps in order and keeps a trace of each. */
export class RollingDomainSummaryEngine {
  steps: RollingDomainSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingDomainSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingDomainSummary): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RollingDomainSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingDomainSummaryEngine(flagsValue: flags.Registry): RollingDomainSummaryEngine {
  return new RollingDomainSummaryEngine(
    [
      new FlaggedRollingDomainSummaryAdjuster(flagsValue, "rolling-domain-summary-adaptive", 6),
      new RoundingRollingDomainSummaryAdjuster(0.1),
      new TitleRollingDomainSummaryAdjuster(new Map<string, number>([["south", 0.85]])),
      new MinimumRollingDomainSummaryAdjuster(42.8),
      new PercentRollingDomainSummaryAdjuster(-17.6),
    ],
    [],
    3.4,
    89363.9,
  );
}
