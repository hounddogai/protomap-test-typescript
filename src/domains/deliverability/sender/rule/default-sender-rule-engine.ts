import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultSenderRule } from "./default-sender-rule.js";

/** One step of the default sender rule calculation. */
export interface DefaultSenderRuleFactor {
  describe(): string;
  adjust(item: DefaultSenderRule, value: number): number;
}

export class FlaggedDefaultSenderRuleAdjuster implements DefaultSenderRuleFactor {
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

  adjust(item: DefaultSenderRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultSenderRuleAdjuster implements DefaultSenderRuleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultSenderRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DefaultSenderRuleThresholdOffsetAdjuster implements DefaultSenderRuleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: DefaultSenderRule, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the default sender rule steps in order and keeps a trace of each. */
export class DefaultSenderRuleEngine {
  steps: DefaultSenderRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultSenderRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultSenderRule): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: DefaultSenderRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultSenderRuleEngine(flagsValue: flags.Registry): DefaultSenderRuleEngine {
  return new DefaultSenderRuleEngine(
    [
      new FlaggedDefaultSenderRuleAdjuster(flagsValue, "default-sender-rule-capped", -7.4),
      new PercentDefaultSenderRuleAdjuster(20.3),
      new DefaultSenderRuleThresholdOffsetAdjuster(0.2),
    ],
    [],
    4.2,
    93548.6,
  );
}
