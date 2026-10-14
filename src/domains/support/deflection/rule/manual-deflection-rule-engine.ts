import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualDeflectionRule } from "./manual-deflection-rule.js";

/** One step of the manual deflection rule calculation. */
export interface ManualDeflectionRuleStep {
  describe(): string;
  adjust(item: ManualDeflectionRule, value: number): number;
}

export class ManualDeflectionRuleThresholdOffsetAdjuster implements ManualDeflectionRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: ManualDeflectionRule, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class UtmSourceManualDeflectionRuleAdjuster implements ManualDeflectionRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ManualDeflectionRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapManualDeflectionRuleAdjuster implements ManualDeflectionRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualDeflectionRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedManualDeflectionRuleAdjuster implements ManualDeflectionRuleStep {
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

  adjust(item: ManualDeflectionRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualDeflectionRuleAdjuster implements ManualDeflectionRuleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualDeflectionRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingManualDeflectionRuleAdjuster implements ManualDeflectionRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualDeflectionRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual deflection rule steps in order and keeps a trace of each. */
export class ManualDeflectionRuleEngine {
  steps: ManualDeflectionRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualDeflectionRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualDeflectionRule): number {
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

  evaluateAll(items: ManualDeflectionRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualDeflectionRuleEngine(flagsValue: flags.Registry): ManualDeflectionRuleEngine {
  return new ManualDeflectionRuleEngine(
    [
      new ManualDeflectionRuleThresholdOffsetAdjuster(1.16),
      new UtmSourceManualDeflectionRuleAdjuster(
        new Map<string, number>([["online", 0.95], ["east", 0.98], ["central", 1.4]]),
      ),
      new CapManualDeflectionRuleAdjuster(10242),
      new FlaggedManualDeflectionRuleAdjuster(flagsValue, "manual-deflection-rule-fallback", -0.4),
      new MinimumManualDeflectionRuleAdjuster(19.9),
      new RoundingManualDeflectionRuleAdjuster(1),
    ],
    [],
    1.3,
    68688.6,
  );
}
