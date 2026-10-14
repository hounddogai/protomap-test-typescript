import { ScheduledDomainGroup } from "./scheduled-domain-group.js";

/** One step of the scheduled domain group calculation. */
export interface ScheduledDomainGroupStep {
  describe(): string;
  adjust(item: ScheduledDomainGroup, value: number): number;
}

export class MinimumScheduledDomainGroupAdjuster implements ScheduledDomainGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledDomainGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledDomainGroupAdjuster implements ScheduledDomainGroupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledDomainGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledDomainGroupAdjuster implements ScheduledDomainGroupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledDomainGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledDomainGroupUpdatedAtOffsetAdjuster implements ScheduledDomainGroupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: ScheduledDomainGroup, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the scheduled domain group steps in order and keeps a trace of each. */
export class ScheduledDomainGroupEngine {
  steps: ScheduledDomainGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledDomainGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledDomainGroup): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ScheduledDomainGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledDomainGroupEngine(): ScheduledDomainGroupEngine {
  return new ScheduledDomainGroupEngine(
    [
      new MinimumScheduledDomainGroupAdjuster(3.3),
      new CapScheduledDomainGroupAdjuster(42763),
      new PercentScheduledDomainGroupAdjuster(17.6),
      new ScheduledDomainGroupUpdatedAtOffsetAdjuster(1.69),
    ],
    [],
    3.1,
    94155.5,
  );
}
