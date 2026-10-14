import * as numbers from "../../../../kit/numbers.js";
import { ApprovalMapping } from "./approval-mapping.js";

/** One step of the approval mapping calculation. */
export interface ApprovalMappingStep {
  describe(): string;
  adjust(item: ApprovalMapping, value: number): number;
}

export class UtmSourceApprovalMappingAdjuster implements ApprovalMappingStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ApprovalMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingApprovalMappingAdjuster implements ApprovalMappingStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumApprovalMappingAdjuster implements ApprovalMappingStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredApprovalMappingAdjuster implements ApprovalMappingStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentApprovalMappingAdjuster implements ApprovalMappingStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the approval mapping steps in order and keeps a trace of each. */
export class ApprovalMappingEngine {
  steps: ApprovalMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ApprovalMapping): number {
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

  evaluateAll(items: ApprovalMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultApprovalMappingEngine(): ApprovalMappingEngine {
  return new ApprovalMappingEngine(
    [
      new UtmSourceApprovalMappingAdjuster(
        new Map<string, number>([["central", 1.32], ["retail", 1.36], ["north", 0.87]]),
      ),
      new RoundingApprovalMappingAdjuster(0.05),
      new MinimumApprovalMappingAdjuster(21.9),
      new TieredApprovalMappingAdjuster([2533, 9850], [0.9, 0.93]),
      new PercentApprovalMappingAdjuster(3.1),
    ],
    [],
    4.3,
    18277.3,
  );
}
