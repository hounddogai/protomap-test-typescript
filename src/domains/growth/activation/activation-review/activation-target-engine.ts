import * as numbers from "../../../../kit/numbers.js";
import { ActivationTarget } from "./activation-target.js";

/** One step of the activation target calculation. */
export interface ActivationTargetStep {
  describe(): string;
  adjust(item: ActivationTarget, value: number): number;
}

export class PercentActivationTargetAdjuster implements ActivationTargetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumActivationTargetAdjuster implements ActivationTargetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapActivationTargetAdjuster implements ActivationTargetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the activation target steps in order and keeps a trace of each. */
export class ActivationTargetEngine {
  steps: ActivationTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ActivationTarget): number {
    let current = item.effectiveVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: ActivationTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultActivationTargetEngine(): ActivationTargetEngine {
  return new ActivationTargetEngine(
    [
      new PercentActivationTargetAdjuster(-1.3),
      new MinimumActivationTargetAdjuster(12.7),
      new CapActivationTargetAdjuster(28714),
    ],
    [],
    4.2,
    84518.9,
  );
}
