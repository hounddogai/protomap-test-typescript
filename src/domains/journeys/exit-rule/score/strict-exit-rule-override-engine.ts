import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictExitRuleOverride } from "./strict-exit-rule-override.js";

/** One step of the strict exit rule override calculation. */
export interface StrictExitRuleOverrideModifier {
  describe(): string;
  adjust(item: StrictExitRuleOverride, value: number): number;
}

export class PercentStrictExitRuleOverrideAdjuster implements StrictExitRuleOverrideModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictExitRuleOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictExitRuleOverrideAdjuster implements StrictExitRuleOverrideModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictExitRuleOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedStrictExitRuleOverrideAdjuster implements StrictExitRuleOverrideModifier {
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

  adjust(item: StrictExitRuleOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict exit rule override steps in order and keeps a trace of each. */
export class StrictExitRuleOverrideEngine {
  steps: StrictExitRuleOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictExitRuleOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictExitRuleOverride): number {
    let current = item.adjustedExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: StrictExitRuleOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictExitRuleOverrideEngine(flagsValue: flags.Registry): StrictExitRuleOverrideEngine {
  return new StrictExitRuleOverrideEngine(
    [
      new PercentStrictExitRuleOverrideAdjuster(-22.4),
      new RoundingStrictExitRuleOverrideAdjuster(0.5),
      new FlaggedStrictExitRuleOverrideAdjuster(flagsValue, "strict-exit-rule-override-scheduled", -4),
    ],
    [],
    1.9,
    82376.9,
  );
}
