import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedActivationSegment } from "./weighted-activation-segment.js";

/** One step of the weighted activation segment calculation. */
export interface WeightedActivationSegmentStep {
  describe(): string;
  adjust(item: WeightedActivationSegment, value: number): number;
}

export class TieredWeightedActivationSegmentAdjuster implements WeightedActivationSegmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedActivationSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WeightedActivationSegmentCeilingOffsetAdjuster implements WeightedActivationSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: WeightedActivationSegment, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class FlaggedWeightedActivationSegmentAdjuster implements WeightedActivationSegmentStep {
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

  adjust(item: WeightedActivationSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedActivationSegmentAdjuster implements WeightedActivationSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedActivationSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedActivationSegmentAdjuster implements WeightedActivationSegmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedActivationSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted activation segment steps in order and keeps a trace of each. */
export class WeightedActivationSegmentEngine {
  steps: WeightedActivationSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedActivationSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedActivationSegment): number {
    let current = item.weightedValue();
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

  evaluateAll(items: WeightedActivationSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedActivationSegmentEngine(flagsValue: flags.Registry): WeightedActivationSegmentEngine {
  return new WeightedActivationSegmentEngine(
    [
      new TieredWeightedActivationSegmentAdjuster([742, 5070, 9349, 9982], [1.1, 1.03, 0.98, 1.08]),
      new WeightedActivationSegmentCeilingOffsetAdjuster(0.1),
      new FlaggedWeightedActivationSegmentAdjuster(flagsValue, "weighted-activation-segment-pending", 2.7),
      new MinimumWeightedActivationSegmentAdjuster(22),
      new RoundingWeightedActivationSegmentAdjuster(0.1),
    ],
    [],
    1.1,
    85991.3,
  );
}
