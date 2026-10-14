import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingMetric } from "./pacing-metric.js";

/** One step of the pacing metric calculation. */
export interface PacingMetricModifier {
  describe(): string;
  adjust(item: PacingMetric, value: number): number;
}

export class RoundingPacingMetricAdjuster implements PacingMetricModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PacingMetricWindowDaysOffsetAdjuster implements PacingMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: PacingMetric, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class TitlePacingMetricAdjuster implements PacingMetricModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PacingMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPacingMetricAdjuster implements PacingMetricModifier {
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

  adjust(item: PacingMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pacing metric steps in order and keeps a trace of each. */
export class PacingMetricEngine {
  steps: PacingMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PacingMetric): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: PacingMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPacingMetricEngine(flagsValue: flags.Registry): PacingMetricEngine {
  return new PacingMetricEngine(
    [
      new RoundingPacingMetricAdjuster(1),
      new PacingMetricWindowDaysOffsetAdjuster(0.82),
      new TitlePacingMetricAdjuster(
        new Map<string, number>([["online", 1.15], ["west", 0.73], ["retail", 0.86]]),
      ),
      new FlaggedPacingMetricAdjuster(flagsValue, "pacing-metric-batched", -0.1),
    ],
    [],
    3.5,
    81756.6,
  );
}
