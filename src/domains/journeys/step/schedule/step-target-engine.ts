import * as flags from "../../../../kit/flags.js";
import { StepTarget } from "./step-target.js";

/** One step of the step target calculation. */
export interface StepTargetStep {
  describe(): string;
  adjust(item: StepTarget, value: number): number;
}

export class PercentStepTargetAdjuster implements StepTargetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StepTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedStepTargetAdjuster implements StepTargetStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: StepTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStepTargetAdjuster implements StepTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the step target steps in order and keeps a trace of each. */
export class StepTargetEngine {
  steps: StepTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StepTarget): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: StepTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStepTargetEngine(flagsValue: flags.Registry): StepTargetEngine {
  return new StepTargetEngine(
    [
      new PercentStepTargetAdjuster(-15.2),
      new FlaggedStepTargetAdjuster(flagsValue, "step-target-default", 0.8),
      new MinimumStepTargetAdjuster(17),
    ],
    [],
    3.6,
    90428.5,
  );
}
