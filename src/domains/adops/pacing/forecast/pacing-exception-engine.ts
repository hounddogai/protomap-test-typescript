import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingException } from "./pacing-exception.js";

/** One step of the pacing exception calculation. */
export interface PacingExceptionModifier {
  describe(): string;
  adjust(item: PacingException, value: number): number;
}

export class PacingExceptionCapacityOffsetAdjuster implements PacingExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: PacingException, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class MinimumPacingExceptionAdjuster implements PacingExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPacingExceptionAdjuster implements PacingExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPacingExceptionAdjuster implements PacingExceptionModifier {
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

  adjust(item: PacingException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitlePacingExceptionAdjuster implements PacingExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PacingException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pacing exception steps in order and keeps a trace of each. */
export class PacingExceptionEngine {
  steps: PacingExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PacingException): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: PacingException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPacingExceptionEngine(flagsValue: flags.Registry): PacingExceptionEngine {
  return new PacingExceptionEngine(
    [
      new PacingExceptionCapacityOffsetAdjuster(0.19),
      new MinimumPacingExceptionAdjuster(7.9),
      new CapPacingExceptionAdjuster(1604),
      new FlaggedPacingExceptionAdjuster(flagsValue, "pacing-exception-weighted", 2.6),
      new TitlePacingExceptionAdjuster(new Map<string, number>([["central", 0.89]])),
    ],
    [],
    0.1,
    1235.8,
  );
}
