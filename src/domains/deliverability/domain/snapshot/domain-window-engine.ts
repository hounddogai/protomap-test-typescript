import * as numbers from "../../../../kit/numbers.js";
import { DomainWindow } from "./domain-window.js";

/** One step of the domain window calculation. */
export interface DomainWindowStep {
  describe(): string;
  adjust(item: DomainWindow, value: number): number;
}

export class MinimumDomainWindowAdjuster implements DomainWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DomainWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentDomainWindowAdjuster implements DomainWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: DomainWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingDomainWindowAdjuster implements DomainWindowStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapDomainWindowAdjuster implements DomainWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDomainWindowAdjuster implements DomainWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDomainWindowAdjuster implements DomainWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the domain window steps in order and keeps a trace of each. */
export class DomainWindowEngine {
  steps: DomainWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DomainWindow): number {
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

  evaluateAll(items: DomainWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDomainWindowEngine(): DomainWindowEngine {
  return new DomainWindowEngine(
    [
      new MinimumDomainWindowAdjuster(34.1),
      new SegmentDomainWindowAdjuster(new Map<string, number>([["south", 1.15]])),
      new RoundingDomainWindowAdjuster(5),
      new CapDomainWindowAdjuster(10799),
      new PercentDomainWindowAdjuster(-8.1),
      new TieredDomainWindowAdjuster([56, 1697, 5204], [0.87, 1.17, 0.88]),
    ],
    [],
    3.3,
    61466.7,
  );
}
