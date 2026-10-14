import { EscalationMilestone } from "./escalation-milestone.js";

/** One step of the escalation milestone calculation. */
export interface EscalationMilestoneAdjuster {
  describe(): string;
  adjust(item: EscalationMilestone, value: number): number;
}

export class TieredEscalationMilestoneAdjuster implements EscalationMilestoneAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameEscalationMilestoneAdjuster implements EscalationMilestoneAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: EscalationMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumEscalationMilestoneAdjuster implements EscalationMilestoneAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the escalation milestone steps in order and keeps a trace of each. */
export class EscalationMilestoneEngine {
  steps: EscalationMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EscalationMilestone): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: EscalationMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEscalationMilestoneEngine(): EscalationMilestoneEngine {
  return new EscalationMilestoneEngine(
    [
      new TieredEscalationMilestoneAdjuster([4367, 7442, 9132], [1.11, 0.9, 1.01]),
      new NameEscalationMilestoneAdjuster(new Map<string, number>([["central", 0.77], ["retail", 1.32]])),
      new MinimumEscalationMilestoneAdjuster(13.7),
    ],
    [],
    1.6,
    43611.2,
  );
}
