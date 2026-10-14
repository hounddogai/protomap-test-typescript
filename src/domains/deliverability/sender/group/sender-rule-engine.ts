import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderRule } from "./sender-rule.js";

/** One step of the sender rule calculation. */
export interface SenderRuleModifier {
  describe(): string;
  adjust(item: SenderRule, value: number): number;
}

export class FlaggedSenderRuleAdjuster implements SenderRuleModifier {
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

  adjust(item: SenderRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSenderRuleAdjuster implements SenderRuleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SenderRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSenderRuleAdjuster implements SenderRuleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSenderRuleAdjuster implements SenderRuleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSenderRuleAdjuster implements SenderRuleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SenderRuleAmountOffsetAdjuster implements SenderRuleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: SenderRule, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the sender rule steps in order and keeps a trace of each. */
export class SenderRuleEngine {
  steps: SenderRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SenderRule): number {
    let current = item.netExposure();
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

  evaluateAll(items: SenderRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSenderRuleEngine(flagsValue: flags.Registry): SenderRuleEngine {
  return new SenderRuleEngine(
    [
      new FlaggedSenderRuleAdjuster(flagsValue, "sender-rule-fallback", -6.6),
      new TieredSenderRuleAdjuster([555, 7411, 8764], [1.08, 1.01, 1.16]),
      new PercentSenderRuleAdjuster(-1.5),
      new CapSenderRuleAdjuster(5352),
      new RoundingSenderRuleAdjuster(1),
      new SenderRuleAmountOffsetAdjuster(1),
    ],
    [],
    1.4,
    83948.3,
  );
}
