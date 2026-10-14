import { DomainMilestone } from "./domain-milestone.js";

/** One step of the domain milestone calculation. */
export interface DomainMilestoneAdjuster {
  describe(): string;
  adjust(item: DomainMilestone, value: number): number;
}

export class CapDomainMilestoneAdjuster implements DomainMilestoneAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDomainMilestoneAdjuster implements DomainMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDomainMilestoneAdjuster implements DomainMilestoneAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DomainMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the domain milestone steps in order and keeps a trace of each. */
export class DomainMilestoneEngine {
  steps: DomainMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DomainMilestone): number {
    let current = item.netTotal();
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

  evaluateAll(items: DomainMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDomainMilestoneEngine(): DomainMilestoneEngine {
  return new DomainMilestoneEngine(
    [
      new CapDomainMilestoneAdjuster(9079),
      new PercentDomainMilestoneAdjuster(15.5),
      new MinimumDomainMilestoneAdjuster(49.2),
    ],
    [],
    1.2,
    63334.3,
  );
}
