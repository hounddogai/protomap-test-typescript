import * as numbers from "../../../../kit/numbers.js";
import { ProofMetric } from "./proof-metric.js";

/** One step of the proof metric calculation. */
export interface ProofMetricStep {
  describe(): string;
  adjust(item: ProofMetric, value: number): number;
}

export class CapProofMetricAdjuster implements ProofMetricStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelProofMetricAdjuster implements ProofMetricStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ProofMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingProofMetricAdjuster implements ProofMetricStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofMetric, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ProofMetricImpressionsOffsetAdjuster implements ProofMetricStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: ProofMetric, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class MinimumProofMetricAdjuster implements ProofMetricStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredProofMetricAdjuster implements ProofMetricStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the proof metric steps in order and keeps a trace of each. */
export class ProofMetricEngine {
  steps: ProofMetricStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofMetricStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ProofMetric): number {
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

  evaluateAll(items: ProofMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultProofMetricEngine(): ProofMetricEngine {
  return new ProofMetricEngine(
    [
      new CapProofMetricAdjuster(29654),
      new LabelProofMetricAdjuster(new Map<string, number>([["north", 1.22], ["online", 0.8], ["south", 1.15]])),
      new RoundingProofMetricAdjuster(5),
      new ProofMetricImpressionsOffsetAdjuster(0.05),
      new MinimumProofMetricAdjuster(45.5),
      new TieredProofMetricAdjuster([711, 4080, 4233, 9801], [1.16, 1.17, 1.02, 1.16]),
    ],
    [],
    2.5,
    65758.5,
  );
}
