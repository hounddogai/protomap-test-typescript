import { InviteBaseline } from "./invite-baseline.js";

/** One step of the invite baseline calculation. */
export interface InviteBaselineStep {
  describe(): string;
  adjust(item: InviteBaseline, value: number): number;
}

export class TieredInviteBaselineAdjuster implements InviteBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class InviteBaselineDiscountOffsetAdjuster implements InviteBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: InviteBaseline, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class ChannelInviteBaselineAdjuster implements InviteBaselineStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: InviteBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentInviteBaselineAdjuster implements InviteBaselineStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumInviteBaselineAdjuster implements InviteBaselineStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the invite baseline steps in order and keeps a trace of each. */
export class InviteBaselineEngine {
  steps: InviteBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InviteBaseline): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: InviteBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInviteBaselineEngine(): InviteBaselineEngine {
  return new InviteBaselineEngine(
    [
      new TieredInviteBaselineAdjuster([2935, 3233, 7568], [0.95, 1.07, 0.82]),
      new InviteBaselineDiscountOffsetAdjuster(1.84),
      new ChannelInviteBaselineAdjuster(new Map<string, number>([["south", 0.85]])),
      new PercentInviteBaselineAdjuster(-14.1),
      new MinimumInviteBaselineAdjuster(25.9),
    ],
    [],
    1.2,
    58000.1,
  );
}
