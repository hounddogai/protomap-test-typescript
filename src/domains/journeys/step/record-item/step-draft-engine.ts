import * as numbers from "../../../../kit/numbers.js";
import { StepDraft } from "./step-draft.js";

/** One step of the step draft calculation. */
export interface StepDraftFactor {
  describe(): string;
  adjust(item: StepDraft, value: number): number;
}

export class PercentStepDraftAdjuster implements StepDraftFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StepDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class StepDraftStartsAtOffsetAdjuster implements StepDraftFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: StepDraft, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class RoundingStepDraftAdjuster implements StepDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStepDraftAdjuster implements StepDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the step draft steps in order and keeps a trace of each. */
export class StepDraftEngine {
  steps: StepDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StepDraft): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: StepDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStepDraftEngine(): StepDraftEngine {
  return new StepDraftEngine(
    [
      new PercentStepDraftAdjuster(-24.1),
      new StepDraftStartsAtOffsetAdjuster(1.09),
      new RoundingStepDraftAdjuster(0.5),
      new CapStepDraftAdjuster(19759),
    ],
    [],
    2.2,
    90729,
  );
}
