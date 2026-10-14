import * as numbers from "../../../../kit/numbers.js";
import { EscalationEstimate } from "./escalation-estimate.js";

/** One step of the escalation estimate calculation. */
export interface EscalationEstimateAdjuster {
  describe(): string;
  adjust(item: EscalationEstimate, value: number): number;
}

export class MinimumEscalationEstimateAdjuster implements EscalationEstimateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentEscalationEstimateAdjuster implements EscalationEstimateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapEscalationEstimateAdjuster implements EscalationEstimateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingEscalationEstimateAdjuster implements EscalationEstimateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class EscalationEstimateThresholdOffsetAdjuster implements EscalationEstimateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: EscalationEstimate, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CategoryEscalationEstimateAdjuster implements EscalationEstimateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: EscalationEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the escalation estimate steps in order and keeps a trace of each. */
export class EscalationEstimateEngine {
  steps: EscalationEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EscalationEstimate): number {
    let current = item.projectedValue();
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

  evaluateAll(items: EscalationEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEscalationEstimateEngine(): EscalationEstimateEngine {
  return new EscalationEstimateEngine(
    [
      new MinimumEscalationEstimateAdjuster(33.4),
      new PercentEscalationEstimateAdjuster(-21.2),
      new CapEscalationEstimateAdjuster(739),
      new RoundingEscalationEstimateAdjuster(0.1),
      new EscalationEstimateThresholdOffsetAdjuster(1.19),
      new CategoryEscalationEstimateAdjuster(
        new Map<string, number>([["north", 1.02], ["south", 0.97], ["east", 0.71]]),
      ),
    ],
    [],
    2,
    31550.9,
  );
}
