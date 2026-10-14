import * as numbers from "../../../../kit/numbers.js";
import { FallbackSuppressionAudit } from "./fallback-suppression-audit.js";

/** One step of the fallback suppression audit calculation. */
export interface FallbackSuppressionAuditStep {
  describe(): string;
  adjust(item: FallbackSuppressionAudit, value: number): number;
}

export class PercentFallbackSuppressionAuditAdjuster implements FallbackSuppressionAuditStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackSuppressionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FallbackSuppressionAuditImpressionsOffsetAdjuster implements FallbackSuppressionAuditStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: FallbackSuppressionAudit, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingFallbackSuppressionAuditAdjuster implements FallbackSuppressionAuditStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackSuppressionAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleFallbackSuppressionAuditAdjuster implements FallbackSuppressionAuditStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FallbackSuppressionAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackSuppressionAuditAdjuster implements FallbackSuppressionAuditStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackSuppressionAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackSuppressionAuditAdjuster implements FallbackSuppressionAuditStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackSuppressionAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback suppression audit steps in order and keeps a trace of each. */
export class FallbackSuppressionAuditEngine {
  steps: FallbackSuppressionAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSuppressionAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackSuppressionAudit): number {
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

  evaluateAll(items: FallbackSuppressionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackSuppressionAuditEngine(): FallbackSuppressionAuditEngine {
  return new FallbackSuppressionAuditEngine(
    [
      new PercentFallbackSuppressionAuditAdjuster(2.9),
      new FallbackSuppressionAuditImpressionsOffsetAdjuster(0.76),
      new RoundingFallbackSuppressionAuditAdjuster(5),
      new TitleFallbackSuppressionAuditAdjuster(
        new Map<string, number>([["central", 0.93], ["retail", 1.05], ["east", 1.03]]),
      ),
      new MinimumFallbackSuppressionAuditAdjuster(7.5),
      new TieredFallbackSuppressionAuditAdjuster([626, 1978, 4448], [0.87, 1.09, 0.98]),
    ],
    [],
    2,
    23865.1,
  );
}
