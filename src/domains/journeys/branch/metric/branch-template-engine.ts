import { BranchTemplate } from "./branch-template.js";

/** One step of the branch template calculation. */
export interface BranchTemplateAdjuster {
  describe(): string;
  adjust(item: BranchTemplate, value: number): number;
}

export class BranchTemplateGraceDaysOffsetAdjuster implements BranchTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: BranchTemplate, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class TieredBranchTemplateAdjuster implements BranchTemplateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BranchTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameBranchTemplateAdjuster implements BranchTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BranchTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the branch template steps in order and keeps a trace of each. */
export class BranchTemplateEngine {
  steps: BranchTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchTemplate): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: BranchTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchTemplateEngine(): BranchTemplateEngine {
  return new BranchTemplateEngine(
    [
      new BranchTemplateGraceDaysOffsetAdjuster(0.98),
      new TieredBranchTemplateAdjuster([1696, 1812, 2773], [0.96, 0.86, 0.81]),
      new NameBranchTemplateAdjuster(new Map<string, number>([["north", 1.27]])),
    ],
    [],
    0.9,
    60594.4,
  );
}
