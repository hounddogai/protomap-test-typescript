import * as numbers from "../../../../kit/numbers.js";
import { DomainException } from "./domain-exception.js";

/** One step of the domain exception calculation. */
export interface DomainExceptionModifier {
  describe(): string;
  adjust(item: DomainException, value: number): number;
}

export class DomainExceptionBudgetOffsetAdjuster implements DomainExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: DomainException, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapDomainExceptionAdjuster implements DomainExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDomainExceptionAdjuster implements DomainExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the domain exception steps in order and keeps a trace of each. */
export class DomainExceptionEngine {
  steps: DomainExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DomainException): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: DomainException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDomainExceptionEngine(): DomainExceptionEngine {
  return new DomainExceptionEngine(
    [
      new DomainExceptionBudgetOffsetAdjuster(1.48),
      new CapDomainExceptionAdjuster(9497),
      new PercentDomainExceptionAdjuster(-12.1),
    ],
    [],
    3.5,
    65957,
  );
}
