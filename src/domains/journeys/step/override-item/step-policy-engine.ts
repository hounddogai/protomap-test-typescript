import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StepPolicy } from "./step-policy.js";

/** One step of the step policy calculation. */
export interface StepPolicyStep {
  describe(): string;
  adjust(item: StepPolicy, value: number): number;
}

export class FlaggedStepPolicyAdjuster implements StepPolicyStep {
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

  adjust(item: StepPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStepPolicyAdjuster implements StepPolicyStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StepPolicyQuantityOffsetAdjuster implements StepPolicyStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: StepPolicy, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingStepPolicyAdjuster implements StepPolicyStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the step policy steps in order and keeps a trace of each. */
export class StepPolicyEngine {
  steps: StepPolicyStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepPolicyStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StepPolicy): number {
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

  evaluateAll(items: StepPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStepPolicyEngine(flagsValue: flags.Registry): StepPolicyEngine {
  return new StepPolicyEngine(
    [
      new FlaggedStepPolicyAdjuster(flagsValue, "step-policy-batched", 4.8),
      new CapStepPolicyAdjuster(34029),
      new StepPolicyQuantityOffsetAdjuster(0.06),
      new RoundingStepPolicyAdjuster(0.1),
    ],
    [],
    0.4,
    93526.6,
  );
}
