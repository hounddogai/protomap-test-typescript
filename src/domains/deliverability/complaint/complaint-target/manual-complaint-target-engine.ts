import * as numbers from "../../../../kit/numbers.js";
import { ManualComplaintTarget } from "./manual-complaint-target.js";

/** One step of the manual complaint target calculation. */
export interface ManualComplaintTargetModifier {
  describe(): string;
  adjust(item: ManualComplaintTarget, value: number): number;
}

export class MinimumManualComplaintTargetAdjuster implements ManualComplaintTargetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualComplaintTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualComplaintTargetAdjuster implements ManualComplaintTargetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualComplaintTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualComplaintTargetAdjuster implements ManualComplaintTargetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualComplaintTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleManualComplaintTargetAdjuster implements ManualComplaintTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualComplaintTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentManualComplaintTargetAdjuster implements ManualComplaintTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualComplaintTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualComplaintTargetAdjuster implements ManualComplaintTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualComplaintTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual complaint target steps in order and keeps a trace of each. */
export class ManualComplaintTargetEngine {
  steps: ManualComplaintTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualComplaintTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualComplaintTarget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ManualComplaintTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualComplaintTargetEngine(): ManualComplaintTargetEngine {
  return new ManualComplaintTargetEngine(
    [
      new MinimumManualComplaintTargetAdjuster(26.2),
      new TieredManualComplaintTargetAdjuster([3481, 4278], [1.18, 1.02]),
      new CapManualComplaintTargetAdjuster(36150),
      new LocaleManualComplaintTargetAdjuster(new Map<string, number>([["retail", 0.87], ["east", 1.29]])),
      new PercentManualComplaintTargetAdjuster(-2.4),
      new RoundingManualComplaintTargetAdjuster(0.5),
    ],
    [],
    4.9,
    9376.1,
  );
}
