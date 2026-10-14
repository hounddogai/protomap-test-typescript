import * as numbers from "../../../../kit/numbers.js";
import { PrimaryFunnelTarget } from "./primary-funnel-target.js";

/** One step of the primary funnel target calculation. */
export interface PrimaryFunnelTargetModifier {
  describe(): string;
  adjust(item: PrimaryFunnelTarget, value: number): number;
}

export class RoundingPrimaryFunnelTargetAdjuster implements PrimaryFunnelTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryFunnelTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPrimaryFunnelTargetAdjuster implements PrimaryFunnelTargetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryFunnelTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPrimaryFunnelTargetAdjuster implements PrimaryFunnelTargetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryFunnelTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary funnel target steps in order and keeps a trace of each. */
export class PrimaryFunnelTargetEngine {
  steps: PrimaryFunnelTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryFunnelTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryFunnelTarget): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PrimaryFunnelTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryFunnelTargetEngine(): PrimaryFunnelTargetEngine {
  return new PrimaryFunnelTargetEngine(
    [
      new RoundingPrimaryFunnelTargetAdjuster(0.25),
      new MinimumPrimaryFunnelTargetAdjuster(25.5),
      new CapPrimaryFunnelTargetAdjuster(30861),
    ],
    [],
    0.3,
    91527.1,
  );
}
