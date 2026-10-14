import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleClaim } from "./exit-rule-claim.js";

/** One step of the exit rule claim calculation. */
export interface ExitRuleClaimModifier {
  describe(): string;
  adjust(item: ExitRuleClaim, value: number): number;
}

export class RoundingExitRuleClaimAdjuster implements ExitRuleClaimModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ExitRuleClaimMinimumOffsetAdjuster implements ExitRuleClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: ExitRuleClaim, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class FlaggedExitRuleClaimAdjuster implements ExitRuleClaimModifier {
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

  adjust(item: ExitRuleClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule claim steps in order and keeps a trace of each. */
export class ExitRuleClaimEngine {
  steps: ExitRuleClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleClaim): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ExitRuleClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleClaimEngine(flagsValue: flags.Registry): ExitRuleClaimEngine {
  return new ExitRuleClaimEngine(
    [
      new RoundingExitRuleClaimAdjuster(1),
      new ExitRuleClaimMinimumOffsetAdjuster(0.98),
      new FlaggedExitRuleClaimAdjuster(flagsValue, "exit-rule-claim-adaptive", 5.4),
    ],
    [],
    4.2,
    73624.8,
  );
}
