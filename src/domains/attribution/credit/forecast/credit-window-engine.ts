import * as numbers from "../../../../kit/numbers.js";
import { CreditWindow } from "./credit-window.js";

/** One step of the credit window calculation. */
export interface CreditWindowFactor {
  describe(): string;
  adjust(item: CreditWindow, value: number): number;
}

export class PercentCreditWindowAdjuster implements CreditWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CreditWindowGraceDaysOffsetAdjuster implements CreditWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: CreditWindow, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CapCreditWindowAdjuster implements CreditWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the credit window steps in order and keeps a trace of each. */
export class CreditWindowEngine {
  steps: CreditWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreditWindow): number {
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

  evaluateAll(items: CreditWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreditWindowEngine(): CreditWindowEngine {
  return new CreditWindowEngine(
    [
      new PercentCreditWindowAdjuster(-2.6),
      new CreditWindowGraceDaysOffsetAdjuster(1.56),
      new CapCreditWindowAdjuster(2731),
    ],
    [],
    1.3,
    88309,
  );
}
