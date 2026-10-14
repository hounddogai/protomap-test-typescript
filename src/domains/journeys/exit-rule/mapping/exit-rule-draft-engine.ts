import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleDraft } from "./exit-rule-draft.js";

/** One step of the exit rule draft calculation. */
export interface ExitRuleDraftStep {
  describe(): string;
  adjust(item: ExitRuleDraft, value: number): number;
}

export class FlaggedExitRuleDraftAdjuster implements ExitRuleDraftStep {
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

  adjust(item: ExitRuleDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingExitRuleDraftAdjuster implements ExitRuleDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentExitRuleDraftAdjuster implements ExitRuleDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the exit rule draft steps in order and keeps a trace of each. */
export class ExitRuleDraftEngine {
  steps: ExitRuleDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleDraft): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ExitRuleDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleDraftEngine(flagsValue: flags.Registry): ExitRuleDraftEngine {
  return new ExitRuleDraftEngine(
    [
      new FlaggedExitRuleDraftAdjuster(flagsValue, "exit-rule-draft-weighted", -6.2),
      new RoundingExitRuleDraftAdjuster(5),
      new PercentExitRuleDraftAdjuster(13.6),
    ],
    [],
    3.7,
    72143.6,
  );
}
