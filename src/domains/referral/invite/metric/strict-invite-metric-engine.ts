import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictInviteMetric } from "./strict-invite-metric.js";

/** One step of the strict invite metric calculation. */
export interface StrictInviteMetricModifier {
  describe(): string;
  adjust(item: StrictInviteMetric, value: number): number;
}

export class RoundingStrictInviteMetricAdjuster implements StrictInviteMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictInviteMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictInviteMetricBudgetOffsetAdjuster implements StrictInviteMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: StrictInviteMetric, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedStrictInviteMetricAdjuster implements StrictInviteMetricModifier {
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

  adjust(item: StrictInviteMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictInviteMetricAdjuster implements StrictInviteMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictInviteMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict invite metric steps in order and keeps a trace of each. */
export class StrictInviteMetricEngine {
  steps: StrictInviteMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictInviteMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictInviteMetric): number {
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

  evaluateAll(items: StrictInviteMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictInviteMetricEngine(flagsValue: flags.Registry): StrictInviteMetricEngine {
  return new StrictInviteMetricEngine(
    [
      new RoundingStrictInviteMetricAdjuster(1),
      new StrictInviteMetricBudgetOffsetAdjuster(1.87),
      new FlaggedStrictInviteMetricAdjuster(flagsValue, "strict-invite-metric-legacy", -3.7),
      new MinimumStrictInviteMetricAdjuster(28.8),
    ],
    [],
    3.6,
    93541.7,
  );
}
