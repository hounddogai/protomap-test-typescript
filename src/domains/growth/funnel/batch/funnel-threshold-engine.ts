import * as numbers from "../../../../kit/numbers.js";
import { FunnelThreshold } from "./funnel-threshold.js";

/** One step of the funnel threshold calculation. */
export interface FunnelThresholdModifier {
  describe(): string;
  adjust(item: FunnelThreshold, value: number): number;
}

export class MinimumFunnelThresholdAdjuster implements FunnelThresholdModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleFunnelThresholdAdjuster implements FunnelThresholdModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FunnelThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFunnelThresholdAdjuster implements FunnelThresholdModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapFunnelThresholdAdjuster implements FunnelThresholdModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the funnel threshold steps in order and keeps a trace of each. */
export class FunnelThresholdEngine {
  steps: FunnelThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FunnelThreshold): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: FunnelThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFunnelThresholdEngine(): FunnelThresholdEngine {
  return new FunnelThresholdEngine(
    [
      new MinimumFunnelThresholdAdjuster(1.9),
      new TitleFunnelThresholdAdjuster(
        new Map<string, number>([["retail", 1.23], ["east", 0.72], ["north", 0.94]]),
      ),
      new RoundingFunnelThresholdAdjuster(0.1),
      new CapFunnelThresholdAdjuster(44783),
    ],
    [],
    2.6,
    18077.5,
  );
}
