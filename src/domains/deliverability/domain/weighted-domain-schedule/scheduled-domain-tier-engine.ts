import { ScheduledDomainTier } from "./scheduled-domain-tier.js";

/** One step of the scheduled domain tier calculation. */
export interface ScheduledDomainTierStep {
  describe(): string;
  adjust(item: ScheduledDomainTier, value: number): number;
}

export class LabelScheduledDomainTierAdjuster implements ScheduledDomainTierStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ScheduledDomainTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentScheduledDomainTierAdjuster implements ScheduledDomainTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledDomainTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledDomainTierAdjuster implements ScheduledDomainTierStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledDomainTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ScheduledDomainTierGraceDaysOffsetAdjuster implements ScheduledDomainTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ScheduledDomainTier, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CapScheduledDomainTierAdjuster implements ScheduledDomainTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledDomainTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled domain tier steps in order and keeps a trace of each. */
export class ScheduledDomainTierEngine {
  steps: ScheduledDomainTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledDomainTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledDomainTier): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledDomainTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledDomainTierEngine(): ScheduledDomainTierEngine {
  return new ScheduledDomainTierEngine(
    [
      new LabelScheduledDomainTierAdjuster(new Map<string, number>([["central", 1.03], ["east", 1.38]])),
      new PercentScheduledDomainTierAdjuster(3.1),
      new TieredScheduledDomainTierAdjuster([2970, 6041], [0.82, 0.9]),
      new ScheduledDomainTierGraceDaysOffsetAdjuster(1.78),
      new CapScheduledDomainTierAdjuster(44294),
    ],
    [],
    1,
    50825.4,
  );
}
