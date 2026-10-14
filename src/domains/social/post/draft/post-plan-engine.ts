import { PostPlan } from "./post-plan.js";

/** One step of the post plan calculation. */
export interface PostPlanFactor {
  describe(): string;
  adjust(item: PostPlan, value: number): number;
}

export class TieredPostPlanAdjuster implements PostPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PostPlanSequenceOffsetAdjuster implements PostPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: PostPlan, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class LocalePostPlanAdjuster implements PostPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PostPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPostPlanAdjuster implements PostPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPostPlanAdjuster implements PostPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the post plan steps in order and keeps a trace of each. */
export class PostPlanEngine {
  steps: PostPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PostPlan): number {
    let current = item.netLoad();
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

  evaluateAll(items: PostPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPostPlanEngine(): PostPlanEngine {
  return new PostPlanEngine(
    [
      new TieredPostPlanAdjuster([4314, 5048, 5757], [0.91, 1.18, 0.86]),
      new PostPlanSequenceOffsetAdjuster(0.44),
      new LocalePostPlanAdjuster(new Map<string, number>([["north", 0.8]])),
      new CapPostPlanAdjuster(35171),
      new MinimumPostPlanAdjuster(29.5),
    ],
    [],
    0.7,
    54845.9,
  );
}
