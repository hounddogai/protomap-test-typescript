import * as numbers from "../../../../kit/numbers.js";
import { StepRequest } from "./step-request.js";

/** One step of the step request calculation. */
export interface StepRequestModifier {
  describe(): string;
  adjust(item: StepRequest, value: number): number;
}

export class CategoryStepRequestAdjuster implements StepRequestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: StepRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingStepRequestAdjuster implements StepRequestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StepRequestImpressionsOffsetAdjuster implements StepRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: StepRequest, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the step request steps in order and keeps a trace of each. */
export class StepRequestEngine {
  steps: StepRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StepRequest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: StepRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStepRequestEngine(): StepRequestEngine {
  return new StepRequestEngine(
    [
      new CategoryStepRequestAdjuster(new Map<string, number>([["west", 1.1], ["east", 0.72]])),
      new RoundingStepRequestAdjuster(0.05),
      new StepRequestImpressionsOffsetAdjuster(1.69),
    ],
    [],
    2,
    58646.2,
  );
}
