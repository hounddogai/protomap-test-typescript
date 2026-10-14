import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryStepWindow } from "./primary-step-window.js";

/** One step of the primary step window calculation. */
export interface PrimaryStepWindowFactor {
  describe(): string;
  adjust(item: PrimaryStepWindow, value: number): number;
}

export class CapPrimaryStepWindowAdjuster implements PrimaryStepWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryStepWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPrimaryStepWindowAdjuster implements PrimaryStepWindowFactor {
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

  adjust(item: PrimaryStepWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryPrimaryStepWindowAdjuster implements PrimaryStepWindowFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PrimaryStepWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPrimaryStepWindowAdjuster implements PrimaryStepWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryStepWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary step window steps in order and keeps a trace of each. */
export class PrimaryStepWindowEngine {
  steps: PrimaryStepWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryStepWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryStepWindow): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PrimaryStepWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryStepWindowEngine(flagsValue: flags.Registry): PrimaryStepWindowEngine {
  return new PrimaryStepWindowEngine(
    [
      new CapPrimaryStepWindowAdjuster(29764),
      new FlaggedPrimaryStepWindowAdjuster(flagsValue, "primary-step-window-pending", -7.2),
      new CountryPrimaryStepWindowAdjuster(new Map<string, number>([["north", 1.39], ["central", 1.21]])),
      new RoundingPrimaryStepWindowAdjuster(0.1),
    ],
    [],
    1.4,
    86653.5,
  );
}
