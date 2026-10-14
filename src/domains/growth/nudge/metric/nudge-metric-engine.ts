import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeMetric } from "./nudge-metric.js";

/** One step of the nudge metric calculation. */
export interface NudgeMetricModifier {
  describe(): string;
  adjust(item: NudgeMetric, value: number): number;
}

export class FlaggedNudgeMetricAdjuster implements NudgeMetricModifier {
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

  adjust(item: NudgeMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NudgeMetricAttemptsOffsetAdjuster implements NudgeMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: NudgeMetric, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class RoundingNudgeMetricAdjuster implements NudgeMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelNudgeMetricAdjuster implements NudgeMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: NudgeMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumNudgeMetricAdjuster implements NudgeMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: NudgeMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the nudge metric steps in order and keeps a trace of each. */
export class NudgeMetricEngine {
  steps: NudgeMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: NudgeMetric): number {
    let current = item.netExposure();
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

  evaluateAll(items: NudgeMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultNudgeMetricEngine(flagsValue: flags.Registry): NudgeMetricEngine {
  return new NudgeMetricEngine(
    [
      new FlaggedNudgeMetricAdjuster(flagsValue, "nudge-metric-lenient", 8.1),
      new NudgeMetricAttemptsOffsetAdjuster(1.81),
      new RoundingNudgeMetricAdjuster(1),
      new LabelNudgeMetricAdjuster(
        new Map<string, number>([["north", 1.23], ["central", 1.11], ["online", 1.17]]),
      ),
      new MinimumNudgeMetricAdjuster(19),
    ],
    [],
    4.9,
    45788.5,
  );
}
