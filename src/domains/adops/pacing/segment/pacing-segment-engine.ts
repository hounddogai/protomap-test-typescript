import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingSegment } from "./pacing-segment.js";

/** One step of the pacing segment calculation. */
export interface PacingSegmentStep {
  describe(): string;
  adjust(item: PacingSegment, value: number): number;
}

export class NamePacingSegmentAdjuster implements PacingSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PacingSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPacingSegmentAdjuster implements PacingSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPacingSegmentAdjuster implements PacingSegmentStep {
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

  adjust(item: PacingSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPacingSegmentAdjuster implements PacingSegmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPacingSegmentAdjuster implements PacingSegmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pacing segment steps in order and keeps a trace of each. */
export class PacingSegmentEngine {
  steps: PacingSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PacingSegment): number {
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

  evaluateAll(items: PacingSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPacingSegmentEngine(flagsValue: flags.Registry): PacingSegmentEngine {
  return new PacingSegmentEngine(
    [
      new NamePacingSegmentAdjuster(new Map<string, number>([["online", 0.76], ["west", 1.39]])),
      new MinimumPacingSegmentAdjuster(49.4),
      new FlaggedPacingSegmentAdjuster(flagsValue, "pacing-segment-adaptive", 5.6),
      new TieredPacingSegmentAdjuster([6131, 9327], [1.1, 0.84]),
      new RoundingPacingSegmentAdjuster(5),
    ],
    [],
    1.1,
    28592.3,
  );
}
