import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultMacroSegment } from "./default-macro-segment.js";

/** One step of the default macro segment calculation. */
export interface DefaultMacroSegmentAdjuster {
  describe(): string;
  adjust(item: DefaultMacroSegment, value: number): number;
}

export class MinimumDefaultMacroSegmentAdjuster implements DefaultMacroSegmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultMacroSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredDefaultMacroSegmentAdjuster implements DefaultMacroSegmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultMacroSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultMacroSegmentAdjuster implements DefaultMacroSegmentAdjuster {
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

  adjust(item: DefaultMacroSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DefaultMacroSegmentCeilingOffsetAdjuster implements DefaultMacroSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: DefaultMacroSegment, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class LabelDefaultMacroSegmentAdjuster implements DefaultMacroSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DefaultMacroSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingDefaultMacroSegmentAdjuster implements DefaultMacroSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultMacroSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default macro segment steps in order and keeps a trace of each. */
export class DefaultMacroSegmentEngine {
  steps: DefaultMacroSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultMacroSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultMacroSegment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: DefaultMacroSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultMacroSegmentEngine(flagsValue: flags.Registry): DefaultMacroSegmentEngine {
  return new DefaultMacroSegmentEngine(
    [
      new MinimumDefaultMacroSegmentAdjuster(28.7),
      new TieredDefaultMacroSegmentAdjuster([1001, 2996, 7417, 7754], [1.06, 0.85, 0.83, 1.16]),
      new FlaggedDefaultMacroSegmentAdjuster(flagsValue, "default-macro-segment-rolling", 3.2),
      new DefaultMacroSegmentCeilingOffsetAdjuster(1.6),
      new LabelDefaultMacroSegmentAdjuster(new Map<string, number>([["central", 1.02]])),
      new RoundingDefaultMacroSegmentAdjuster(0.1),
    ],
    [],
    1.6,
    46519.8,
  );
}
