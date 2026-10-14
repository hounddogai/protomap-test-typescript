import * as numbers from "../../../../kit/numbers.js";
import { EscalationMetric } from "./escalation-metric.js";

/** One step of the escalation metric calculation. */
export interface EscalationMetricFactor {
  describe(): string;
  adjust(item: EscalationMetric, value: number): number;
}

export class LabelEscalationMetricAdjuster implements EscalationMetricFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: EscalationMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredEscalationMetricAdjuster implements EscalationMetricFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class EscalationMetricCeilingOffsetAdjuster implements EscalationMetricFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: EscalationMetric, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class PercentEscalationMetricAdjuster implements EscalationMetricFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the escalation metric steps in order and keeps a trace of each. */
export class EscalationMetricEngine {
  steps: EscalationMetricFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationMetricFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EscalationMetric): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: EscalationMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEscalationMetricEngine(): EscalationMetricEngine {
  return new EscalationMetricEngine(
    [
      new LabelEscalationMetricAdjuster(new Map<string, number>([["retail", 1.17]])),
      new TieredEscalationMetricAdjuster([4012, 4427, 6302, 7561], [1.03, 1.01, 0.87, 1.15]),
      new EscalationMetricCeilingOffsetAdjuster(0.41),
      new PercentEscalationMetricAdjuster(10.2),
    ],
    [],
    2.2,
    13612.6,
  );
}
