import * as numbers from "../../../../kit/numbers.js";
import { PendingSlaTarget } from "./pending-sla-target.js";

/** One step of the pending sla target calculation. */
export interface PendingSlaTargetAdjuster {
  describe(): string;
  adjust(item: PendingSlaTarget, value: number): number;
}

export class RoundingPendingSlaTargetAdjuster implements PendingSlaTargetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingSlaTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelPendingSlaTargetAdjuster implements PendingSlaTargetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingSlaTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingSlaTargetAdjuster implements PendingSlaTargetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingSlaTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingSlaTargetCapacityOffsetAdjuster implements PendingSlaTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: PendingSlaTarget, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class CapPendingSlaTargetAdjuster implements PendingSlaTargetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingSlaTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPendingSlaTargetAdjuster implements PendingSlaTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSlaTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending sla target steps in order and keeps a trace of each. */
export class PendingSlaTargetEngine {
  steps: PendingSlaTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSlaTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingSlaTarget): number {
    let current = item.projectedValue();
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

  evaluateAll(items: PendingSlaTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingSlaTargetEngine(): PendingSlaTargetEngine {
  return new PendingSlaTargetEngine(
    [
      new RoundingPendingSlaTargetAdjuster(0.05),
      new LabelPendingSlaTargetAdjuster(new Map<string, number>([["west", 0.93], ["south", 0.92]])),
      new PercentPendingSlaTargetAdjuster(15.2),
      new PendingSlaTargetCapacityOffsetAdjuster(0.42),
      new CapPendingSlaTargetAdjuster(15176),
      new MinimumPendingSlaTargetAdjuster(39.2),
    ],
    [],
    0.8,
    50405,
  );
}
