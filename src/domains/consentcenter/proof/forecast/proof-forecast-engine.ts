import * as numbers from "../../../../kit/numbers.js";
import { ProofForecast } from "./proof-forecast.js";

/** One step of the proof forecast calculation. */
export interface ProofForecastModifier {
  describe(): string;
  adjust(item: ProofForecast, value: number): number;
}

export class PercentProofForecastAdjuster implements ProofForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumProofForecastAdjuster implements ProofForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ProofForecastGraceDaysOffsetAdjuster implements ProofForecastModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ProofForecast, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class CapProofForecastAdjuster implements ProofForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionProofForecastAdjuster implements ProofForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ProofForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the proof forecast steps in order and keeps a trace of each. */
export class ProofForecastEngine {
  steps: ProofForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ProofForecast): number {
    let current = item.netExposure();
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

  evaluateAll(items: ProofForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultProofForecastEngine(): ProofForecastEngine {
  return new ProofForecastEngine(
    [
      new PercentProofForecastAdjuster(4.6),
      new MinimumProofForecastAdjuster(43.5),
      new ProofForecastGraceDaysOffsetAdjuster(1.68),
      new CapProofForecastAdjuster(42046),
      new RegionProofForecastAdjuster(new Map<string, number>([["retail", 1.32]])),
    ],
    [],
    4.8,
    63402.5,
  );
}
