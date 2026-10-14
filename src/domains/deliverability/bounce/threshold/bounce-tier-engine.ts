import * as numbers from "../../../../kit/numbers.js";
import { BounceTier } from "./bounce-tier.js";

/** One step of the bounce tier calculation. */
export interface BounceTierModifier {
  describe(): string;
  adjust(item: BounceTier, value: number): number;
}

export class NameBounceTierAdjuster implements BounceTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BounceTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBounceTierAdjuster implements BounceTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BounceTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBounceTierAdjuster implements BounceTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the bounce tier steps in order and keeps a trace of each. */
export class BounceTierEngine {
  steps: BounceTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BounceTier): number {
    let current = item.netTotal();
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

  evaluateAll(items: BounceTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBounceTierEngine(): BounceTierEngine {
  return new BounceTierEngine(
    [
      new NameBounceTierAdjuster(new Map<string, number>([["south", 1.26], ["online", 0.75], ["north", 1.01]])),
      new PercentBounceTierAdjuster(12.8),
      new MinimumBounceTierAdjuster(4.7),
    ],
    [],
    2.4,
    80676.6,
  );
}
