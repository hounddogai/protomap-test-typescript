import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleDigest } from "./exit-rule-digest.js";

/** One step of the exit rule digest calculation. */
export interface ExitRuleDigestFactor {
  describe(): string;
  adjust(item: ExitRuleDigest, value: number): number;
}

export class FlaggedExitRuleDigestAdjuster implements ExitRuleDigestFactor {
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

  adjust(item: ExitRuleDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredExitRuleDigestAdjuster implements ExitRuleDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingExitRuleDigestAdjuster implements ExitRuleDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the exit rule digest steps in order and keeps a trace of each. */
export class ExitRuleDigestEngine {
  steps: ExitRuleDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ExitRuleDigest): number {
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

  evaluateAll(items: ExitRuleDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultExitRuleDigestEngine(flagsValue: flags.Registry): ExitRuleDigestEngine {
  return new ExitRuleDigestEngine(
    [
      new FlaggedExitRuleDigestAdjuster(flagsValue, "exit-rule-digest-regional", -3.3),
      new TieredExitRuleDigestAdjuster([4273, 6901], [0.81, 0.96]),
      new RoundingExitRuleDigestAdjuster(0.25),
    ],
    [],
    0.7,
    46263.7,
  );
}
