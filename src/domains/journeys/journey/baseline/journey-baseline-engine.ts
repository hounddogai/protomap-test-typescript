import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { JourneyBaseline } from "./journey-baseline.js";

/** One step of the journey baseline calculation. */
export interface JourneyBaselineStep {
  describe(): string;
  adjust(item: JourneyBaseline, value: number): number;
}

export class PercentJourneyBaselineAdjuster implements JourneyBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: JourneyBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumJourneyBaselineAdjuster implements JourneyBaselineStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedJourneyBaselineAdjuster implements JourneyBaselineStep {
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

  adjust(item: JourneyBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class JourneyBaselineMinimumOffsetAdjuster implements JourneyBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: JourneyBaseline, value: number): number {
    return value + item.minimum * this.weight;
  }
}

/** Runs the journey baseline steps in order and keeps a trace of each. */
export class JourneyBaselineEngine {
  steps: JourneyBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: JourneyBaseline): number {
    let current = item.netValue();
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

  evaluateAll(items: JourneyBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultJourneyBaselineEngine(flagsValue: flags.Registry): JourneyBaselineEngine {
  return new JourneyBaselineEngine(
    [
      new PercentJourneyBaselineAdjuster(-6.8),
      new MinimumJourneyBaselineAdjuster(34.9),
      new FlaggedJourneyBaselineAdjuster(flagsValue, "journey-baseline-weighted", -5.5),
      new JourneyBaselineMinimumOffsetAdjuster(0.52),
    ],
    [],
    4.9,
    5133,
  );
}
