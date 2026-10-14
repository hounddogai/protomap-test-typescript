import * as numbers from "../../../../kit/numbers.js";
import { EscalationPolicy } from "./escalation-policy.js";

/** One step of the escalation policy calculation. */
export interface EscalationPolicyAdjuster {
  describe(): string;
  adjust(item: EscalationPolicy, value: number): number;
}

export class PercentEscalationPolicyAdjuster implements EscalationPolicyAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapEscalationPolicyAdjuster implements EscalationPolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredEscalationPolicyAdjuster implements EscalationPolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameEscalationPolicyAdjuster implements EscalationPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: EscalationPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class EscalationPolicyRevisionOffsetAdjuster implements EscalationPolicyAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: EscalationPolicy, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the escalation policy steps in order and keeps a trace of each. */
export class EscalationPolicyEngine {
  steps: EscalationPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EscalationPolicy): number {
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

  evaluateAll(items: EscalationPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEscalationPolicyEngine(): EscalationPolicyEngine {
  return new EscalationPolicyEngine(
    [
      new PercentEscalationPolicyAdjuster(6.3),
      new CapEscalationPolicyAdjuster(16361),
      new TieredEscalationPolicyAdjuster([2434, 7479], [0.96, 1.19]),
      new NameEscalationPolicyAdjuster(new Map<string, number>([["central", 0.91]])),
      new EscalationPolicyRevisionOffsetAdjuster(0.98),
    ],
    [],
    2.8,
    9958.9,
  );
}
