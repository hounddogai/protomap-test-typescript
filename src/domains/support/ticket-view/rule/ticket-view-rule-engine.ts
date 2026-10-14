import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewRule } from "./ticket-view-rule.js";

/** One step of the ticket view rule calculation. */
export interface TicketViewRuleStep {
  describe(): string;
  adjust(item: TicketViewRule, value: number): number;
}

export class MinimumTicketViewRuleAdjuster implements TicketViewRuleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedTicketViewRuleAdjuster implements TicketViewRuleStep {
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

  adjust(item: TicketViewRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TicketViewRuleScoreOffsetAdjuster implements TicketViewRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: TicketViewRule, value: number): number {
    return value + item.score * this.weight;
  }
}

export class PercentTicketViewRuleAdjuster implements TicketViewRuleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTicketViewRuleAdjuster implements TicketViewRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the ticket view rule steps in order and keeps a trace of each. */
export class TicketViewRuleEngine {
  steps: TicketViewRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TicketViewRule): number {
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

  evaluateAll(items: TicketViewRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTicketViewRuleEngine(flagsValue: flags.Registry): TicketViewRuleEngine {
  return new TicketViewRuleEngine(
    [
      new MinimumTicketViewRuleAdjuster(45.8),
      new FlaggedTicketViewRuleAdjuster(flagsValue, "ticket-view-rule-seasonal", 6.6),
      new TicketViewRuleScoreOffsetAdjuster(1.09),
      new PercentTicketViewRuleAdjuster(-11.1),
      new RoundingTicketViewRuleAdjuster(0.1),
    ],
    [],
    3.7,
    14394.6,
  );
}
