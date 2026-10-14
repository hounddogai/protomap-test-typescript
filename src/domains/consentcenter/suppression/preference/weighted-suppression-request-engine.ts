import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedSuppressionRequest } from "./weighted-suppression-request.js";

/** One step of the weighted suppression request calculation. */
export interface WeightedSuppressionRequestStep {
  describe(): string;
  adjust(item: WeightedSuppressionRequest, value: number): number;
}

export class MinimumWeightedSuppressionRequestAdjuster implements WeightedSuppressionRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedSuppressionRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedSuppressionRequestAdjuster implements WeightedSuppressionRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedSuppressionRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedSuppressionRequestAdjuster implements WeightedSuppressionRequestStep {
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

  adjust(item: WeightedSuppressionRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedSuppressionRequestOpenRateOffsetAdjuster implements WeightedSuppressionRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: WeightedSuppressionRequest, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class SourceWeightedSuppressionRequestAdjuster implements WeightedSuppressionRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: WeightedSuppressionRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWeightedSuppressionRequestAdjuster implements WeightedSuppressionRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedSuppressionRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the weighted suppression request steps in order and keeps a trace of each. */
export class WeightedSuppressionRequestEngine {
  steps: WeightedSuppressionRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedSuppressionRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedSuppressionRequest): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: WeightedSuppressionRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedSuppressionRequestEngine(flagsValue: flags.Registry): WeightedSuppressionRequestEngine {
  return new WeightedSuppressionRequestEngine(
    [
      new MinimumWeightedSuppressionRequestAdjuster(5.6),
      new RoundingWeightedSuppressionRequestAdjuster(0.1),
      new FlaggedWeightedSuppressionRequestAdjuster(flagsValue, "weighted-suppression-request-pending", -7.3),
      new WeightedSuppressionRequestOpenRateOffsetAdjuster(1.52),
      new SourceWeightedSuppressionRequestAdjuster(
        new Map<string, number>([["south", 1.39], ["central", 0.79]]),
      ),
      new CapWeightedSuppressionRequestAdjuster(15675),
    ],
    [],
    3.9,
    46474.1,
  );
}
