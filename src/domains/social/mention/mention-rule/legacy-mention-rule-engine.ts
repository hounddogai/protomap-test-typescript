import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyMentionRule } from "./legacy-mention-rule.js";

/** One step of the legacy mention rule calculation. */
export interface LegacyMentionRuleStep {
  describe(): string;
  adjust(item: LegacyMentionRule, value: number): number;
}

export class TitleLegacyMentionRuleAdjuster implements LegacyMentionRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LegacyMentionRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLegacyMentionRuleAdjuster implements LegacyMentionRuleStep {
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

  adjust(item: LegacyMentionRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyMentionRuleAdjuster implements LegacyMentionRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyMentionRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyMentionRuleAdjuster implements LegacyMentionRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyMentionRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy mention rule steps in order and keeps a trace of each. */
export class LegacyMentionRuleEngine {
  steps: LegacyMentionRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyMentionRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyMentionRule): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LegacyMentionRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyMentionRuleEngine(flagsValue: flags.Registry): LegacyMentionRuleEngine {
  return new LegacyMentionRuleEngine(
    [
      new TitleLegacyMentionRuleAdjuster(
        new Map<string, number>([["south", 1.16], ["east", 0.76], ["west", 0.88]]),
      ),
      new FlaggedLegacyMentionRuleAdjuster(flagsValue, "legacy-mention-rule-seasonal", -8.1),
      new CapLegacyMentionRuleAdjuster(22544),
      new RoundingLegacyMentionRuleAdjuster(0.5),
    ],
    [],
    1.1,
    38861.7,
  );
}
