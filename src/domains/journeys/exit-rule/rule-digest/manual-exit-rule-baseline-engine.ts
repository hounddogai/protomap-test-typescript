import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualExitRuleBaseline } from "./manual-exit-rule-baseline.js";

/** One step of the manual exit rule baseline calculation. */
export interface ManualExitRuleBaselineFactor {
  describe(): string;
  adjust(item: ManualExitRuleBaseline, value: number): number;
}

export class FlaggedManualExitRuleBaselineAdjuster implements ManualExitRuleBaselineFactor {
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

  adjust(item: ManualExitRuleBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleManualExitRuleBaselineAdjuster implements ManualExitRuleBaselineFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualExitRuleBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredManualExitRuleBaselineAdjuster implements ManualExitRuleBaselineFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualExitRuleBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentManualExitRuleBaselineAdjuster implements ManualExitRuleBaselineFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualExitRuleBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapManualExitRuleBaselineAdjuster implements ManualExitRuleBaselineFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualExitRuleBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualExitRuleBaselineAdjuster implements ManualExitRuleBaselineFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualExitRuleBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual exit rule baseline steps in order and keeps a trace of each. */
export class ManualExitRuleBaselineEngine {
  steps: ManualExitRuleBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualExitRuleBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualExitRuleBaseline): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ManualExitRuleBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualExitRuleBaselineEngine(flagsValue: flags.Registry): ManualExitRuleBaselineEngine {
  return new ManualExitRuleBaselineEngine(
    [
      new FlaggedManualExitRuleBaselineAdjuster(flagsValue, "manual-exit-rule-baseline-seasonal", -8.5),
      new LocaleManualExitRuleBaselineAdjuster(new Map<string, number>([["online", 1.14], ["retail", 0.99]])),
      new TieredManualExitRuleBaselineAdjuster([14, 636, 1759, 5663], [0.92, 1.19, 0.9, 0.82]),
      new PercentManualExitRuleBaselineAdjuster(-17.1),
      new CapManualExitRuleBaselineAdjuster(22157),
      new RoundingManualExitRuleBaselineAdjuster(0.1),
    ],
    [],
    0.1,
    94153.3,
  );
}
