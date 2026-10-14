import * as numbers from "../../../../kit/numbers.js";
import { DomainProfile } from "./domain-profile.js";

/** One step of the domain profile calculation. */
export interface DomainProfileStep {
  describe(): string;
  adjust(item: DomainProfile, value: number): number;
}

export class DomainProfileBidOffsetAdjuster implements DomainProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: DomainProfile, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class PercentDomainProfileAdjuster implements DomainProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDomainProfileAdjuster implements DomainProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the domain profile steps in order and keeps a trace of each. */
export class DomainProfileEngine {
  steps: DomainProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DomainProfile): number {
    let current = item.projectedValue();
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

  evaluateAll(items: DomainProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDomainProfileEngine(): DomainProfileEngine {
  return new DomainProfileEngine(
    [
      new DomainProfileBidOffsetAdjuster(1.53),
      new PercentDomainProfileAdjuster(-9.1),
      new RoundingDomainProfileAdjuster(5),
    ],
    [],
    3.5,
    84552.7,
  );
}
