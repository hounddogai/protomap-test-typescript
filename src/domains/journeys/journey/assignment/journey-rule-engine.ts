import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { JourneyRule } from "./journey-rule.js";

/** One step of the journey rule calculation. */
export interface JourneyRuleFactor {
  describe(): string;
  adjust(item: JourneyRule, value: number): number;
}

export class RoundingJourneyRuleAdjuster implements JourneyRuleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumJourneyRuleAdjuster implements JourneyRuleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedJourneyRuleAdjuster implements JourneyRuleFactor {
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

  adjust(item: JourneyRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the journey rule steps in order and keeps a trace of each. */
export class JourneyRuleEngine {
  steps: JourneyRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: JourneyRule): number {
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

  evaluateAll(items: JourneyRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultJourneyRuleEngine(flagsValue: flags.Registry): JourneyRuleEngine {
  return new JourneyRuleEngine(
    [
      new RoundingJourneyRuleAdjuster(5),
      new MinimumJourneyRuleAdjuster(21.9),
      new FlaggedJourneyRuleAdjuster(flagsValue, "journey-rule-lenient", 9.7),
    ],
    [],
    4.5,
    91920.7,
  );
}
