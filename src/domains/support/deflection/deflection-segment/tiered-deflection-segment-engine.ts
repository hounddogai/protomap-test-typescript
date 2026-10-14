import * as numbers from "../../../../kit/numbers.js";
import { TieredDeflectionSegment } from "./tiered-deflection-segment.js";

/** One step of the tiered deflection segment calculation. */
export interface TieredDeflectionSegmentStep {
  describe(): string;
  adjust(item: TieredDeflectionSegment, value: number): number;
}

export class NameTieredDeflectionSegmentAdjuster implements TieredDeflectionSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredDeflectionSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTieredDeflectionSegmentAdjuster implements TieredDeflectionSegmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredDeflectionSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredDeflectionSegmentRevisionOffsetAdjuster implements TieredDeflectionSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: TieredDeflectionSegment, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the tiered deflection segment steps in order and keeps a trace of each. */
export class TieredDeflectionSegmentEngine {
  steps: TieredDeflectionSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDeflectionSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredDeflectionSegment): number {
    let current = item.netVolume();
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

  evaluateAll(items: TieredDeflectionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredDeflectionSegmentEngine(): TieredDeflectionSegmentEngine {
  return new TieredDeflectionSegmentEngine(
    [
      new NameTieredDeflectionSegmentAdjuster(new Map<string, number>([["central", 1.19]])),
      new RoundingTieredDeflectionSegmentAdjuster(0.1),
      new TieredDeflectionSegmentRevisionOffsetAdjuster(1.21),
    ],
    [],
    2,
    39148.4,
  );
}
