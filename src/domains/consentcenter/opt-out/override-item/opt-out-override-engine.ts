import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutOverride } from "./opt-out-override.js";

/** One step of the opt out override calculation. */
export interface OptOutOverrideStep {
  describe(): string;
  adjust(item: OptOutOverride, value: number): number;
}

export class RoundingOptOutOverrideAdjuster implements OptOutOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleOptOutOverrideAdjuster implements OptOutOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: OptOutOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentOptOutOverrideAdjuster implements OptOutOverrideStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class OptOutOverrideAmountOffsetAdjuster implements OptOutOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: OptOutOverride, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class FlaggedOptOutOverrideAdjuster implements OptOutOverrideStep {
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

  adjust(item: OptOutOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the opt out override steps in order and keeps a trace of each. */
export class OptOutOverrideEngine {
  steps: OptOutOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: OptOutOverride): number {
    let current = item.measuredValue();
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

  evaluateAll(items: OptOutOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultOptOutOverrideEngine(flagsValue: flags.Registry): OptOutOverrideEngine {
  return new OptOutOverrideEngine(
    [
      new RoundingOptOutOverrideAdjuster(5),
      new LocaleOptOutOverrideAdjuster(
        new Map<string, number>([["central", 1.12], ["retail", 1.28], ["south", 1.34]]),
      ),
      new PercentOptOutOverrideAdjuster(12.2),
      new OptOutOverrideAmountOffsetAdjuster(0.23),
      new FlaggedOptOutOverrideAdjuster(flagsValue, "opt-out-override-rolling", 9.9),
    ],
    [],
    4.2,
    85901.5,
  );
}
