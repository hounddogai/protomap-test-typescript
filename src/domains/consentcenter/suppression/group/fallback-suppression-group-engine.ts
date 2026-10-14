import * as numbers from "../../../../kit/numbers.js";
import { FallbackSuppressionGroup } from "./fallback-suppression-group.js";

/** One step of the fallback suppression group calculation. */
export interface FallbackSuppressionGroupModifier {
  describe(): string;
  adjust(item: FallbackSuppressionGroup, value: number): number;
}

export class FallbackSuppressionGroupLimitOffsetAdjuster implements FallbackSuppressionGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: FallbackSuppressionGroup, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class LocaleFallbackSuppressionGroupAdjuster implements FallbackSuppressionGroupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FallbackSuppressionGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFallbackSuppressionGroupAdjuster implements FallbackSuppressionGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackSuppressionGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback suppression group steps in order and keeps a trace of each. */
export class FallbackSuppressionGroupEngine {
  steps: FallbackSuppressionGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSuppressionGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackSuppressionGroup): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackSuppressionGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackSuppressionGroupEngine(): FallbackSuppressionGroupEngine {
  return new FallbackSuppressionGroupEngine(
    [
      new FallbackSuppressionGroupLimitOffsetAdjuster(0.09),
      new LocaleFallbackSuppressionGroupAdjuster(new Map<string, number>([["east", 0.78], ["central", 0.96]])),
      new RoundingFallbackSuppressionGroupAdjuster(0.05),
    ],
    [],
    2.5,
    96269.1,
  );
}
