import * as numbers from "../../../../kit/numbers.js";
import { ComplaintOverride } from "./complaint-override.js";

/** One step of the complaint override calculation. */
export interface ComplaintOverrideStep {
  describe(): string;
  adjust(item: ComplaintOverride, value: number): number;
}

export class PercentComplaintOverrideAdjuster implements ComplaintOverrideStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingComplaintOverrideAdjuster implements ComplaintOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelComplaintOverrideAdjuster implements ComplaintOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ComplaintOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumComplaintOverrideAdjuster implements ComplaintOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ComplaintOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the complaint override steps in order and keeps a trace of each. */
export class ComplaintOverrideEngine {
  steps: ComplaintOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ComplaintOverride): number {
    let current = item.netExposure();
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

  evaluateAll(items: ComplaintOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultComplaintOverrideEngine(): ComplaintOverrideEngine {
  return new ComplaintOverrideEngine(
    [
      new PercentComplaintOverrideAdjuster(7.8),
      new RoundingComplaintOverrideAdjuster(5),
      new LabelComplaintOverrideAdjuster(new Map<string, number>([["north", 0.87]])),
      new MinimumComplaintOverrideAdjuster(22.3),
    ],
    [],
    1.4,
    90306.6,
  );
}
