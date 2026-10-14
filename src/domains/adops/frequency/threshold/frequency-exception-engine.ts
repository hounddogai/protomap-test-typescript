import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FrequencyException } from "./frequency-exception.js";

/** One step of the frequency exception calculation. */
export interface FrequencyExceptionStep {
  describe(): string;
  adjust(item: FrequencyException, value: number): number;
}

export class RoundingFrequencyExceptionAdjuster implements FrequencyExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFrequencyExceptionAdjuster implements FrequencyExceptionStep {
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

  adjust(item: FrequencyException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFrequencyExceptionAdjuster implements FrequencyExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFrequencyExceptionAdjuster implements FrequencyExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FrequencyExceptionDurationMinutesOffsetAdjuster implements FrequencyExceptionStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: FrequencyException, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class MinimumFrequencyExceptionAdjuster implements FrequencyExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the frequency exception steps in order and keeps a trace of each. */
export class FrequencyExceptionEngine {
  steps: FrequencyExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FrequencyException): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: FrequencyException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFrequencyExceptionEngine(flagsValue: flags.Registry): FrequencyExceptionEngine {
  return new FrequencyExceptionEngine(
    [
      new RoundingFrequencyExceptionAdjuster(0.5),
      new FlaggedFrequencyExceptionAdjuster(flagsValue, "frequency-exception-legacy", 6.3),
      new CapFrequencyExceptionAdjuster(28313),
      new PercentFrequencyExceptionAdjuster(22.9),
      new FrequencyExceptionDurationMinutesOffsetAdjuster(0.95),
      new MinimumFrequencyExceptionAdjuster(15),
    ],
    [],
    2.1,
    34867,
  );
}
