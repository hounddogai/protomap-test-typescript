import * as numbers from "../../../../kit/numbers.js";
import { ActivationDigest } from "./activation-digest.js";

/** One step of the activation digest calculation. */
export interface ActivationDigestStep {
  describe(): string;
  adjust(item: ActivationDigest, value: number): number;
}

export class TitleActivationDigestAdjuster implements ActivationDigestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ActivationDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredActivationDigestAdjuster implements ActivationDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentActivationDigestAdjuster implements ActivationDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumActivationDigestAdjuster implements ActivationDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the activation digest steps in order and keeps a trace of each. */
export class ActivationDigestEngine {
  steps: ActivationDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ActivationDigest): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ActivationDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultActivationDigestEngine(): ActivationDigestEngine {
  return new ActivationDigestEngine(
    [
      new TitleActivationDigestAdjuster(new Map<string, number>([["retail", 1.31]])),
      new TieredActivationDigestAdjuster([1187, 1727, 8778], [0.94, 1.16, 1.15]),
      new PercentActivationDigestAdjuster(-24.5),
      new MinimumActivationDigestAdjuster(12.8),
    ],
    [],
    0.9,
    58256,
  );
}
