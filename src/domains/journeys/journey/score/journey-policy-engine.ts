import * as numbers from "../../../../kit/numbers.js";
import { JourneyPolicy } from "./journey-policy.js";

/** One step of the journey policy calculation. */
export interface JourneyPolicyStep {
  describe(): string;
  adjust(item: JourneyPolicy, value: number): number;
}

export class PercentJourneyPolicyAdjuster implements JourneyPolicyStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: JourneyPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredJourneyPolicyAdjuster implements JourneyPolicyStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameJourneyPolicyAdjuster implements JourneyPolicyStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: JourneyPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapJourneyPolicyAdjuster implements JourneyPolicyStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the journey policy steps in order and keeps a trace of each. */
export class JourneyPolicyEngine {
  steps: JourneyPolicyStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyPolicyStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: JourneyPolicy): number {
    let current = item.netExposure();
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

  evaluateAll(items: JourneyPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultJourneyPolicyEngine(): JourneyPolicyEngine {
  return new JourneyPolicyEngine(
    [
      new PercentJourneyPolicyAdjuster(-9.3),
      new TieredJourneyPolicyAdjuster([1097, 3226], [1.01, 0.86]),
      new NameJourneyPolicyAdjuster(new Map<string, number>([["north", 0.89], ["online", 0.87]])),
      new CapJourneyPolicyAdjuster(48577),
    ],
    [],
    1.8,
    86527.9,
  );
}
