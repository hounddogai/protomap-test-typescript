import * as numbers from "../../../../kit/numbers.js";
import { FallbackWindowAudit } from "./fallback-window-audit.js";

/** One step of the fallback window audit calculation. */
export interface FallbackWindowAuditModifier {
  describe(): string;
  adjust(item: FallbackWindowAudit, value: number): number;
}

export class RoundingFallbackWindowAuditAdjuster implements FallbackWindowAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackWindowAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFallbackWindowAuditAdjuster implements FallbackWindowAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackWindowAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackWindowAuditAdjuster implements FallbackWindowAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackWindowAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback window audit steps in order and keeps a trace of each. */
export class FallbackWindowAuditEngine {
  steps: FallbackWindowAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackWindowAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackWindowAudit): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: FallbackWindowAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackWindowAuditEngine(): FallbackWindowAuditEngine {
  return new FallbackWindowAuditEngine(
    [
      new RoundingFallbackWindowAuditAdjuster(0.25),
      new TieredFallbackWindowAuditAdjuster([1422, 5252], [1.12, 0.97]),
      new CapFallbackWindowAuditAdjuster(26346),
    ],
    [],
    4,
    82094.7,
  );
}
