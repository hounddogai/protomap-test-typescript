import { ManualBounceMilestone } from "./manual-bounce-milestone.js";

/** One step of the manual bounce milestone calculation. */
export interface ManualBounceMilestoneModifier {
  describe(): string;
  adjust(item: ManualBounceMilestone, value: number): number;
}

export class CapManualBounceMilestoneAdjuster implements ManualBounceMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualBounceMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualBounceMilestoneAdjuster implements ManualBounceMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualBounceMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ManualBounceMilestoneOpenRateOffsetAdjuster implements ManualBounceMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ManualBounceMilestone, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class TieredManualBounceMilestoneAdjuster implements ManualBounceMilestoneModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualBounceMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the manual bounce milestone steps in order and keeps a trace of each. */
export class ManualBounceMilestoneEngine {
  steps: ManualBounceMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualBounceMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualBounceMilestone): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ManualBounceMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualBounceMilestoneEngine(): ManualBounceMilestoneEngine {
  return new ManualBounceMilestoneEngine(
    [
      new CapManualBounceMilestoneAdjuster(26672),
      new MinimumManualBounceMilestoneAdjuster(21),
      new ManualBounceMilestoneOpenRateOffsetAdjuster(1.12),
      new TieredManualBounceMilestoneAdjuster([775, 4226, 10000], [1.15, 0.85, 1.06]),
    ],
    [],
    1.5,
    62178.7,
  );
}
