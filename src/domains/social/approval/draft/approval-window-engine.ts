import * as numbers from "../../../../kit/numbers.js";
import { ApprovalWindow } from "./approval-window.js";

/** One step of the approval window calculation. */
export interface ApprovalWindowStep {
  describe(): string;
  adjust(item: ApprovalWindow, value: number): number;
}

export class RoundingApprovalWindowAdjuster implements ApprovalWindowStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ApprovalWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredApprovalWindowAdjuster implements ApprovalWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumApprovalWindowAdjuster implements ApprovalWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleApprovalWindowAdjuster implements ApprovalWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ApprovalWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the approval window steps in order and keeps a trace of each. */
export class ApprovalWindowEngine {
  steps: ApprovalWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ApprovalWindow): number {
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

  evaluateAll(items: ApprovalWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultApprovalWindowEngine(): ApprovalWindowEngine {
  return new ApprovalWindowEngine(
    [
      new RoundingApprovalWindowAdjuster(5),
      new TieredApprovalWindowAdjuster([5580, 8675, 9107], [0.95, 1.03, 1.04]),
      new MinimumApprovalWindowAdjuster(48.9),
      new TitleApprovalWindowAdjuster(new Map<string, number>([["west", 0.7], ["south", 0.71]])),
    ],
    [],
    3.5,
    73481.3,
  );
}
