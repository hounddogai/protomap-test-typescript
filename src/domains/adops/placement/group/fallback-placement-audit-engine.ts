import * as numbers from "../../../../kit/numbers.js";
import { FallbackPlacementAudit } from "./fallback-placement-audit.js";

/** One step of the fallback placement audit calculation. */
export interface FallbackPlacementAuditModifier {
  describe(): string;
  adjust(item: FallbackPlacementAudit, value: number): number;
}

export class TieredFallbackPlacementAuditAdjuster implements FallbackPlacementAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackPlacementAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFallbackPlacementAuditAdjuster implements FallbackPlacementAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackPlacementAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFallbackPlacementAuditAdjuster implements FallbackPlacementAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackPlacementAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FallbackPlacementAuditScoreOffsetAdjuster implements FallbackPlacementAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: FallbackPlacementAudit, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapFallbackPlacementAuditAdjuster implements FallbackPlacementAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPlacementAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback placement audit steps in order and keeps a trace of each. */
export class FallbackPlacementAuditEngine {
  steps: FallbackPlacementAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPlacementAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackPlacementAudit): number {
    let current = item.effectiveExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: FallbackPlacementAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackPlacementAuditEngine(): FallbackPlacementAuditEngine {
  return new FallbackPlacementAuditEngine(
    [
      new TieredFallbackPlacementAuditAdjuster([2269, 5442], [1.2, 0.93]),
      new MinimumFallbackPlacementAuditAdjuster(39.8),
      new RoundingFallbackPlacementAuditAdjuster(1),
      new FallbackPlacementAuditScoreOffsetAdjuster(1.74),
      new CapFallbackPlacementAuditAdjuster(11664),
    ],
    [],
    2.9,
    14010.5,
  );
}
