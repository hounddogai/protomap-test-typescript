import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ActivationAllocation } from "./activation-allocation.js";

/** One step of the activation allocation calculation. */
export interface ActivationAllocationStep {
  describe(): string;
  adjust(item: ActivationAllocation, value: number): number;
}

export class CapActivationAllocationAdjuster implements ActivationAllocationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingActivationAllocationAdjuster implements ActivationAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ActivationAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedActivationAllocationAdjuster implements ActivationAllocationStep {
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

  adjust(item: ActivationAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentActivationAllocationAdjuster implements ActivationAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the activation allocation steps in order and keeps a trace of each. */
export class ActivationAllocationEngine {
  steps: ActivationAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ActivationAllocation): number {
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

  evaluateAll(items: ActivationAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultActivationAllocationEngine(flagsValue: flags.Registry): ActivationAllocationEngine {
  return new ActivationAllocationEngine(
    [
      new CapActivationAllocationAdjuster(10311),
      new RoundingActivationAllocationAdjuster(0.05),
      new FlaggedActivationAllocationAdjuster(flagsValue, "activation-allocation-default", -0.5),
      new PercentActivationAllocationAdjuster(-17.3),
    ],
    [],
    1.6,
    4666,
  );
}
