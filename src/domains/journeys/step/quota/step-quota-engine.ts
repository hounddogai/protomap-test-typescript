import * as flags from "../../../../kit/flags.js";
import { StepQuota } from "./step-quota.js";

/** One step of the step quota calculation. */
export interface StepQuotaModifier {
  describe(): string;
  adjust(item: StepQuota, value: number): number;
}

export class FlaggedStepQuotaAdjuster implements StepQuotaModifier {
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

  adjust(item: StepQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStepQuotaAdjuster implements StepQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameStepQuotaAdjuster implements StepQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StepQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StepQuotaDiscountOffsetAdjuster implements StepQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: StepQuota, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the step quota steps in order and keeps a trace of each. */
export class StepQuotaEngine {
  steps: StepQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StepQuota): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StepQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStepQuotaEngine(flagsValue: flags.Registry): StepQuotaEngine {
  return new StepQuotaEngine(
    [
      new FlaggedStepQuotaAdjuster(flagsValue, "step-quota-fallback", 5),
      new CapStepQuotaAdjuster(43300),
      new NameStepQuotaAdjuster(new Map<string, number>([["central", 1.07]])),
      new StepQuotaDiscountOffsetAdjuster(0.23),
    ],
    [],
    0.1,
    82107.5,
  );
}
