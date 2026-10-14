import * as flags from "../../../../kit/flags.js";
import { ManualActivationBatch } from "./manual-activation-batch.js";

/** One step of the manual activation batch calculation. */
export interface ManualActivationBatchStep {
  describe(): string;
  adjust(item: ManualActivationBatch, value: number): number;
}

export class CapManualActivationBatchAdjuster implements ManualActivationBatchStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualActivationBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualActivationBatchAdjuster implements ManualActivationBatchStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualActivationBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedManualActivationBatchAdjuster implements ManualActivationBatchStep {
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

  adjust(item: ManualActivationBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ManualActivationBatchRevisionOffsetAdjuster implements ManualActivationBatchStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ManualActivationBatch, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the manual activation batch steps in order and keeps a trace of each. */
export class ManualActivationBatchEngine {
  steps: ManualActivationBatchStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualActivationBatchStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualActivationBatch): number {
    let current = item.netValue();
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

  evaluateAll(items: ManualActivationBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualActivationBatchEngine(flagsValue: flags.Registry): ManualActivationBatchEngine {
  return new ManualActivationBatchEngine(
    [
      new CapManualActivationBatchAdjuster(49917),
      new MinimumManualActivationBatchAdjuster(36.8),
      new FlaggedManualActivationBatchAdjuster(flagsValue, "manual-activation-batch-seasonal", 7.1),
      new ManualActivationBatchRevisionOffsetAdjuster(0.7),
    ],
    [],
    3.5,
    60697.8,
  );
}
