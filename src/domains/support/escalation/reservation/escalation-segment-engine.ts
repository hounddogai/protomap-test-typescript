import * as numbers from "../../../../kit/numbers.js";
import { EscalationSegment } from "./escalation-segment.js";

/** One step of the escalation segment calculation. */
export interface EscalationSegmentFactor {
  describe(): string;
  adjust(item: EscalationSegment, value: number): number;
}

export class NameEscalationSegmentAdjuster implements EscalationSegmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: EscalationSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapEscalationSegmentAdjuster implements EscalationSegmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredEscalationSegmentAdjuster implements EscalationSegmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentEscalationSegmentAdjuster implements EscalationSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingEscalationSegmentAdjuster implements EscalationSegmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class EscalationSegmentThresholdOffsetAdjuster implements EscalationSegmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: EscalationSegment, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the escalation segment steps in order and keeps a trace of each. */
export class EscalationSegmentEngine {
  steps: EscalationSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationSegment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: EscalationSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationSegmentEngine(): EscalationSegmentEngine {
  return new EscalationSegmentEngine(
    [
      new NameEscalationSegmentAdjuster(new Map<string, number>([["west", 0.73], ["north", 0.99]])),
      new CapEscalationSegmentAdjuster(2021),
      new TieredEscalationSegmentAdjuster([1133, 6862, 9179], [1.05, 1.13, 1.04]),
      new PercentEscalationSegmentAdjuster(11.5),
      new RoundingEscalationSegmentAdjuster(5),
      new EscalationSegmentThresholdOffsetAdjuster(1.83),
    ],
    [],
    0.6,
    59808.8,
  );
}
