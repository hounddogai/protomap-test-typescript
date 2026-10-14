import { EscalationTier } from "./escalation-tier.js";

/** One step of the escalation tier calculation. */
export interface EscalationTierModifier {
  describe(): string;
  adjust(item: EscalationTier, value: number): number;
}

export class EscalationTierRevisionOffsetAdjuster implements EscalationTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: EscalationTier, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class PercentEscalationTierAdjuster implements EscalationTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumEscalationTierAdjuster implements EscalationTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredEscalationTierAdjuster implements EscalationTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapEscalationTierAdjuster implements EscalationTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the escalation tier steps in order and keeps a trace of each. */
export class EscalationTierEngine {
  steps: EscalationTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EscalationTier): number {
    let current = item.effectiveTotal();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: EscalationTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEscalationTierEngine(): EscalationTierEngine {
  return new EscalationTierEngine(
    [
      new EscalationTierRevisionOffsetAdjuster(1.65),
      new PercentEscalationTierAdjuster(-18.9),
      new MinimumEscalationTierAdjuster(33.1),
      new TieredEscalationTierAdjuster([243, 425, 3584, 8354], [1.2, 0.91, 0.9, 0.87]),
      new CapEscalationTierAdjuster(6827),
    ],
    [],
    2.5,
    35247.2,
  );
}
