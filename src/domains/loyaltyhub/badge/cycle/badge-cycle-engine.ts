import { BadgeCycle } from "./badge-cycle.js";

/** One step of the badge cycle calculation. */
export interface BadgeCycleFactor {
  describe(): string;
  adjust(item: BadgeCycle, value: number): number;
}

export class CapBadgeCycleAdjuster implements BadgeCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBadgeCycleAdjuster implements BadgeCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionBadgeCycleAdjuster implements BadgeCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: BadgeCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the badge cycle steps in order and keeps a trace of each. */
export class BadgeCycleEngine {
  steps: BadgeCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BadgeCycle): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: BadgeCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBadgeCycleEngine(): BadgeCycleEngine {
  return new BadgeCycleEngine(
    [
      new CapBadgeCycleAdjuster(29338),
      new PercentBadgeCycleAdjuster(0.3),
      new RegionBadgeCycleAdjuster(new Map<string, number>([["retail", 1.37]])),
    ],
    [],
    0.8,
    33214.9,
  );
}
