import * as numbers from "../../../../kit/numbers.js";
import { LegacyExitRuleSegment } from "./legacy-exit-rule-segment.js";

/** One step of the legacy exit rule segment calculation. */
export interface LegacyExitRuleSegmentStep {
  describe(): string;
  adjust(item: LegacyExitRuleSegment, value: number): number;
}

export class MinimumLegacyExitRuleSegmentAdjuster implements LegacyExitRuleSegmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyExitRuleSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyExitRuleSegmentAdjuster implements LegacyExitRuleSegmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyExitRuleSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameLegacyExitRuleSegmentAdjuster implements LegacyExitRuleSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LegacyExitRuleSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LegacyExitRuleSegmentImpressionsOffsetAdjuster implements LegacyExitRuleSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: LegacyExitRuleSegment, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class TieredLegacyExitRuleSegmentAdjuster implements LegacyExitRuleSegmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyExitRuleSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLegacyExitRuleSegmentAdjuster implements LegacyExitRuleSegmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyExitRuleSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy exit rule segment steps in order and keeps a trace of each. */
export class LegacyExitRuleSegmentEngine {
  steps: LegacyExitRuleSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyExitRuleSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyExitRuleSegment): number {
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

  evaluateAll(items: LegacyExitRuleSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyExitRuleSegmentEngine(): LegacyExitRuleSegmentEngine {
  return new LegacyExitRuleSegmentEngine(
    [
      new MinimumLegacyExitRuleSegmentAdjuster(7.7),
      new RoundingLegacyExitRuleSegmentAdjuster(0.5),
      new NameLegacyExitRuleSegmentAdjuster(new Map<string, number>([["south", 0.76]])),
      new LegacyExitRuleSegmentImpressionsOffsetAdjuster(0.27),
      new TieredLegacyExitRuleSegmentAdjuster([5559, 9176], [0.93, 0.89]),
      new PercentLegacyExitRuleSegmentAdjuster(15.5),
    ],
    [],
    2.8,
    8463.1,
  );
}
