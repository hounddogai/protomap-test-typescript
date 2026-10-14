import * as numbers from "../../../../kit/numbers.js";
import { RollingCreditSegment } from "./rolling-credit-segment.js";

/** One step of the rolling credit segment calculation. */
export interface RollingCreditSegmentModifier {
  describe(): string;
  adjust(item: RollingCreditSegment, value: number): number;
}

export class SourceRollingCreditSegmentAdjuster implements RollingCreditSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RollingCreditSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRollingCreditSegmentAdjuster implements RollingCreditSegmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingCreditSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RollingCreditSegmentCeilingOffsetAdjuster implements RollingCreditSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: RollingCreditSegment, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingRollingCreditSegmentAdjuster implements RollingCreditSegmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingCreditSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling credit segment steps in order and keeps a trace of each. */
export class RollingCreditSegmentEngine {
  steps: RollingCreditSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingCreditSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingCreditSegment): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RollingCreditSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingCreditSegmentEngine(): RollingCreditSegmentEngine {
  return new RollingCreditSegmentEngine(
    [
      new SourceRollingCreditSegmentAdjuster(new Map<string, number>([["online", 1.03]])),
      new MinimumRollingCreditSegmentAdjuster(38.2),
      new RollingCreditSegmentCeilingOffsetAdjuster(0.76),
      new RoundingRollingCreditSegmentAdjuster(0.5),
    ],
    [],
    2.7,
    41237.5,
  );
}
