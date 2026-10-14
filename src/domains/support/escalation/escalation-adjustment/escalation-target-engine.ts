import * as numbers from "../../../../kit/numbers.js";
import { EscalationTarget } from "./escalation-target.js";

/** One step of the escalation target calculation. */
export interface EscalationTargetStep {
  describe(): string;
  adjust(item: EscalationTarget, value: number): number;
}

export class TieredEscalationTargetAdjuster implements EscalationTargetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionEscalationTargetAdjuster implements EscalationTargetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: EscalationTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumEscalationTargetAdjuster implements EscalationTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapEscalationTargetAdjuster implements EscalationTargetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class EscalationTargetCapacityOffsetAdjuster implements EscalationTargetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: EscalationTarget, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the escalation target steps in order and keeps a trace of each. */
export class EscalationTargetEngine {
  steps: EscalationTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationTarget): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: EscalationTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationTargetEngine(): EscalationTargetEngine {
  return new EscalationTargetEngine(
    [
      new TieredEscalationTargetAdjuster([4635, 5752, 7434, 9848], [1, 1.1, 1.18, 1.07]),
      new RegionEscalationTargetAdjuster(
        new Map<string, number>([["central", 0.94], ["east", 0.74], ["retail", 1.39]]),
      ),
      new MinimumEscalationTargetAdjuster(22.7),
      new CapEscalationTargetAdjuster(19068),
      new EscalationTargetCapacityOffsetAdjuster(1.3),
    ],
    [],
    0.1,
    80972.9,
  );
}
