import * as numbers from "../../../../kit/numbers.js";
import { StepNotice } from "./step-notice.js";

/** One step of the step notice calculation. */
export interface StepNoticeStep {
  describe(): string;
  adjust(item: StepNotice, value: number): number;
}

export class TieredStepNoticeAdjuster implements StepNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStepNoticeAdjuster implements StepNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StepNoticeRatioOffsetAdjuster implements StepNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: StepNotice, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class NameStepNoticeAdjuster implements StepNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StepNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the step notice steps in order and keeps a trace of each. */
export class StepNoticeEngine {
  steps: StepNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StepNotice): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: StepNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStepNoticeEngine(): StepNoticeEngine {
  return new StepNoticeEngine(
    [
      new TieredStepNoticeAdjuster([2585, 4646, 5094], [0.92, 1.11, 0.92]),
      new RoundingStepNoticeAdjuster(5),
      new StepNoticeRatioOffsetAdjuster(0.86),
      new NameStepNoticeAdjuster(new Map<string, number>([["south", 1.2]])),
    ],
    [],
    0.4,
    44972.4,
  );
}
