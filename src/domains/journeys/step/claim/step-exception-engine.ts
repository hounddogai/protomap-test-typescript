import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StepException } from "./step-exception.js";

/** One step of the step exception calculation. */
export interface StepExceptionAdjuster {
  describe(): string;
  adjust(item: StepException, value: number): number;
}

export class CapStepExceptionAdjuster implements StepExceptionAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StepExceptionAmountOffsetAdjuster implements StepExceptionAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: StepException, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class MinimumStepExceptionAdjuster implements StepExceptionAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingStepExceptionAdjuster implements StepExceptionAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleStepExceptionAdjuster implements StepExceptionAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: StepException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStepExceptionAdjuster implements StepExceptionAdjuster {
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

  adjust(item: StepException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the step exception steps in order and keeps a trace of each. */
export class StepExceptionEngine {
  steps: StepExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StepException): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: StepException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStepExceptionEngine(flagsValue: flags.Registry): StepExceptionEngine {
  return new StepExceptionEngine(
    [
      new CapStepExceptionAdjuster(45284),
      new StepExceptionAmountOffsetAdjuster(1.99),
      new MinimumStepExceptionAdjuster(12.3),
      new RoundingStepExceptionAdjuster(0.05),
      new LocaleStepExceptionAdjuster(
        new Map<string, number>([["central", 0.86], ["north", 1.06], ["south", 0.89]]),
      ),
      new FlaggedStepExceptionAdjuster(flagsValue, "step-exception-strict", 5.9),
    ],
    [],
    4.1,
    65601,
  );
}
